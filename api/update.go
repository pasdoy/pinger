package api

import (
	"fmt"
	log "github.com/sirupsen/logrus"
	"github.com/skratchdot/open-golang/open"
	"github.com/tj/go-update"
	"github.com/tj/go-update/progress"
	"github.com/tj/go-update/stores/github"
	"os"
	"runtime"
	"time"
)

func checkForUpdate() {
	log.Info("Check for update....")
	s := "./pinger"
	if runtime.GOOS == "windows" {
		log.Info("Windows has no auto update working yet :(")
		s = "./pinger.exe"
		return
	}
	m := &update.Manager{
		Command: s,
		Store: &github.Store{
			Owner:   "pasdoy",
			Repo:    "pinger",
			Version: VERSION,
		},
	}

	releases, err := m.LatestReleases()
	if err != nil {
		log.Fatalf("error fetching releases: %s", err)
	}

	if len(releases) == 0 {
		log.Info("no updates")
		return
	}

	latest := releases[0]

	// find the tarball for this system
	a := latest.FindTarball(runtime.GOOS, runtime.GOARCH)
	if a == nil {
		log.Info("no binary for your system")
		return
	}

	tarball, err := a.DownloadProxy(progress.Reader)
	if err != nil {
		log.Fatalf("error downloading: %s", err)
	}

	if err := m.Install(tarball); err != nil {
		log.Fatalf("error installing: %s", err)
	}

	fmt.Printf("Updated to %s\n", latest.Version)

	log.Info("Update done")
	os.Exit(0)
}

func openBrowser(delay int) {
	time.Sleep(time.Duration(delay) * time.Second)
	open.Start(fmt.Sprintf("http://localhost:%d", *port))
}
