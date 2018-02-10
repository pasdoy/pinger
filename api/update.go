package api

import (
	"fmt"
	log "github.com/sirupsen/logrus"
	"github.com/skratchdot/open-golang/open"
	"github.com/tj/go-update"
	"github.com/tj/go-update/progress"
	"github.com/tj/go-update/stores/github"
	"runtime"
	"time"
)

func checkForUpdate() {
	log.Info("Check for update....")
	m := &update.Manager{
		Command: "polls",
		Store: &github.Store{
			Owner:   "pasdoy",
			Repo:    "pinger",
			Version: "0.0.1",
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
}

func openBrowser(delay int) {
	time.Sleep(time.Duration(delay) * time.Second)
	open.Start(fmt.Sprintf("http://localhost:%d", *port))
}
