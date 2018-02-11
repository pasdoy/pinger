package api

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/gobuffalo/packr"
	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
	log "github.com/sirupsen/logrus"
	"gopkg.in/alecthomas/kingpin.v2"
	"net/http"
	"pinger/phantom"
	"runtime"
	"sync"
	"time"
)

var (
	debug        = kingpin.Flag("debug", "Debug mode.").Short('d').OverrideDefaultFromEnvar("DEBUG").Bool()
	VERSION      = "0.1.5"
	port         = kingpin.Flag("port", "API port").Short('p').OverrideDefaultFromEnvar("PORT").Default("3002").Int()
	skipUpdate   = kingpin.Flag("skip-update", "API port").Bool()
	authUsername = kingpin.Flag("auth-username", "Username Basic Auth setup").OverrideDefaultFromEnvar("AUTH_USERNAME").Default("").String()
	authPassword = kingpin.Flag("auth-password", "Password Basic Auth setup").OverrideDefaultFromEnvar("AUTH_PASSWORD").Default("").String()
	shimPort     = 20111
	proxies      chan string
	ch           chan bool
	status       Status
	phantomExe   string
)

type Status struct {
	sync.Mutex
	Active     bool
	FailedReq  int
	SuccessReq int
	TotalReq   int
	MaxReq     int
}

func (s *Status) Success() {
	s.Lock()
	s.SuccessReq += 1
	s.TotalReq += 1
	s.Unlock()
}

func (s *Status) Error() {
	s.Lock()
	s.FailedReq += 1
	s.TotalReq += 1
	s.Unlock()
}

func Start() {
	kingpin.Version(VERSION)
	kingpin.Parse()

	phantomExe = "./phantomjs"
	if runtime.GOOS == "windows" {
		phantomExe = "./phantomjs.exe"
	}

	status = Status{}

	if !*debug && !*skipUpdate {
		checkForUpdate()
	}

	handlePhantomJSBin()

	e := echo.New()
	e.Use(middleware.GzipWithConfig(middleware.GzipConfig{
		Level: 5,
	}))
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"*"},
		AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept},
	}))

	if *authUsername != "" && *authPassword != "" {
		e.Use(middleware.BasicAuth(func(username, password string, c echo.Context) (bool, error) {
			if username == *authUsername && password == *authPassword {
				return true, nil
			}
			return false, nil
		}))
	}

	if !*debug {
		assetHandler := http.FileServer(packr.NewBox("../public/build/"))
		//box := packr.NewBox("public/build")
		e.GET("/*", echo.WrapHandler(assetHandler))
		go openBrowser(1)
	} else {
		log.SetLevel(log.DebugLevel)
	}

	e.POST("/start", startJob)
	e.GET("/stop", stopJob)
	e.GET("/status", getStatus)
	e.POST("/debug", postDebug)

	e.File("/debug/file.png", ".debug/debug.png")

	e.Start(fmt.Sprintf(":%d", *port))

	//start()

}

func getStatus(c echo.Context) error {
	status.Lock()
	o, _ := json.Marshal(status)
	status.Unlock()
	return c.String(http.StatusOK, string(o))
}

func stopJob(c echo.Context) error {
L:
	for {
		select {
		case <-ch:
		default:
			break L
		}
	}
	status = Status{}
	return c.String(http.StatusOK, "ok")
}

type PayloadStart struct {
	URL            string   `json:"url"`
	SleepTime      int      `json:"sleepTime"`
	ThreadCount    int      `json:"threadCount"`
	RequestCount   int      `json:"requestCount"`
	RequestTimeout int      `json:"RequestTimeout"`
	Proxies        []string `json:"proxies"`
	LoadImages     bool     `json:"loadImages"`
	UserAgent      string   `json:"userAgent"`
}

func startJob(c echo.Context) error {
	if status.Active {
		return errors.New("Job is already started")
	}

	r := new(PayloadStart)
	if err := c.Bind(r); err != nil {
		return err
	}
	log.Debug(r)

	ch = make(chan bool, 1000000)
	status = Status{MaxReq: r.RequestCount}
	proxies = make(chan string, len(r.Proxies))
	log.Debugf("Proxies: %d", len(r.Proxies))
	for _, proxy := range r.Proxies {
		proxies <- proxy
	}

	for i := 0; i < r.RequestCount; i++ {
		ch <- true
	}

	for i := 0; i < r.ThreadCount; i++ {
		shimPort += 1
		go start(r.URL, r.SleepTime, ch, shimPort, r.RequestTimeout, r.LoadImages, r.UserAgent)
	}

	status.Active = true

	return c.String(http.StatusOK, "ok")
}

type PayloadDebug struct {
	URL        string `json:"url"`
	Proxy      string `json:"proxy"`
	LoadImages bool   `json:"loadImages"`
	UserAgent  string `json:"userAgent"`
}

func postDebug(c echo.Context) error {
	r := new(PayloadDebug)
	if err := c.Bind(r); err != nil {
		return err
	}

	p := phantom.NewProcess()
	p.BinPath = phantomExe
	p.Port = 30231
	if err := p.Open(); err != nil {
		log.Error(err)
		return errors.New("Cannot start PhantomJS process")
	}
	defer p.Close()

	page, err := p.CreateWebPage()
	if err != nil {
		log.Error(err)
		return errors.New("Cannot start PhantomJS Page")
	}

	currentSettings, _ := page.Settings()
	currentSettings.LoadImages = r.LoadImages
	currentSettings.UserAgent = r.UserAgent
	err = page.SetSettings(currentSettings)
	if err != nil {
		log.Error(err)
		return errors.New("Cannot set PhantomJS Page settings")
	}

	if r.Proxy != "" {
		err = page.SetProxy(r.Proxy)
		if err != nil {
			log.Error(err)
			return errors.New("Cannot set PhantomJS Page proxy")
		}
	}
	log.Debug(r.URL)
	if err := page.Open(r.URL); err != nil {
		log.Error(err)
		return errors.New("Cannot fetch URL")
	}

	err = page.Render("./.debug/debug.png", "PNG", 10)
	if err != nil {
		log.Error(err)
		return errors.New("Failed to render page")
	}

	return c.String(http.StatusOK, "ok")
}

func getProxy() string {
	if len(proxies) == 0 {
		return ""
	}

	p := <-proxies
	proxies <- p
	return p
}

func start(url string, sleepTime int, workChan chan bool, apiPort int, requestTimeout int, loadImages bool, userAgent string) {
	p := phantom.NewProcess()
	p.BinPath = phantomExe
	p.Port = apiPort
	if err := p.Open(); err != nil {
		log.Error(err)
		return
	}
	defer p.Close()

	page, err := p.CreateWebPage()
	if err != nil {
		log.Error(err)
		return
	}

	currentSettings, _ := page.Settings()
	currentSettings.ResourceTimeout = time.Duration(requestTimeout) * time.Second
	currentSettings.LoadImages = loadImages
	currentSettings.UserAgent = userAgent
	page.SetSettings(currentSettings)
	for {
		select {
		case <-workChan:
			p := getProxy()
			if p != "" {
				page.SetProxy(p)
			}
			if err := page.Open(url); err != nil {
				status.Error()
				continue
			}
			log.Debug("Ping worked")
			time.Sleep(time.Duration(sleepTime) * time.Second)
			status.Success()
		default:
			return
		}
	}
}
