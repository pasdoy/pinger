package api

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/benbjohnson/phantomjs"
	"github.com/gobuffalo/packr"
	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
	log "github.com/sirupsen/logrus"
	"gopkg.in/alecthomas/kingpin.v2"
	"net/http"
	"sync"
	"time"
)

var (
	debug      = kingpin.Flag("debug", "Debug mode.").Short('d').OverrideDefaultFromEnvar("DEBUG").Bool()
	VERSION    = "0.1.2"
	port       = kingpin.Flag("port", "API port").Short('p').OverrideDefaultFromEnvar("PORT").Default("3002").Int()
	skipUpdate = kingpin.Flag("skip-update", "API port").Bool()
	shimPort   = 20111
	proxies    chan string
	status     Status
)

type Status struct {
	sync.Mutex
	Active     bool
	FailedReq  int
	SuccessReq int
	TotalReq   int
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

	ch := make(chan bool, 1000000)
	status = Status{}
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

func getProxy() string {
	if len(proxies) == 0 {
		return ""
	}

	p := <-proxies
	proxies <- p
	return p
}

func start(url string, sleepTime int, workChan chan bool, apiPort int, requestTimeout int, loadImages bool, userAgent string) {
	p := phantomjs.NewProcess()
	p.BinPath = "./phantomjs"
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
