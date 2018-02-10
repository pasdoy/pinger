package api

import (
	"archive/zip"
	"fmt"
	log "github.com/sirupsen/logrus"
	"io"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
)

func handlePhantomJSBin() {
	log.Info("Verify PhantomJS")
	defer func() {
		log.Info("PhantomJS OK")
	}()

	phanFile, _ := filepath.Glob("./phantomjs")
	if len(phanFile) > 0 {
		return
	}

	tmpFolder, err := ioutil.TempDir("", "pinger-")
	if err != nil {
		log.Fatal(err)
	}

	log.Info("Downloading PhantomJS...")

	if runtime.GOOS != "linux" {
		downloadPhantomJSLib(filepath.Join(tmpFolder, "./phantomjs.zip"))

		extractPath := filepath.Join(tmpFolder, "extracted")
		Unzip(filepath.Join(tmpFolder, "./phantomjs.zip"), extractPath)

		//get fbinary path
		files, _ := filepath.Glob(filepath.Join(extractPath, "*/bin/phantomjs"))
		if len(files) == 0 {
			log.Fatal("Cannot find phantomjs binary after extraction")
		}

		FileCopy(files[0], "./phantomjs")
		os.Chmod("./phantomjs", 0766)
	} else {
		path := filepath.Join(tmpFolder, "./phantomjs")
		downloadPhantomJSLib(path)
		FileCopy(path, "./phantomjs")
		os.Chmod("./phantomjs", 0766)
	}

	return
}

func downloadPhantomJSLib(fPath string) error {
	out, err := os.Create(fPath)
	if err != nil {
		return err
	}
	defer out.Close()

	url := "https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-2.1.1-windows.zip"
	if runtime.GOOS == "darwin" {
		url = "https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-2.1.1-macosx.zip"
	}
	if runtime.GOOS == "linux" {
		url = "https://github.com/ariya/phantomjs/releases/download/2.1.3/phantomjs"
	}

	// Get the data
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	// Write the body to file
	_, err = io.Copy(out, resp.Body)
	if err != nil {
		return err
	}

	return nil
}

func Unzip(src, dest string) error {
	r, err := zip.OpenReader(src)
	if err != nil {
		return err
	}
	defer func() {
		if err := r.Close(); err != nil {
			panic(err)
		}
	}()

	os.MkdirAll(dest, 0755)

	// Closure to address file descriptors issue with all the deferred .Close() methods
	extractAndWriteFile := func(f *zip.File) error {
		rc, err := f.Open()
		if err != nil {
			return err
		}
		defer func() {
			if err := rc.Close(); err != nil {
				panic(err)
			}
		}()

		path := filepath.Join(dest, f.Name)

		if f.FileInfo().IsDir() {
			os.MkdirAll(path, f.Mode())
		} else {
			os.MkdirAll(filepath.Dir(path), f.Mode())
			f, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.Mode())
			if err != nil {
				return err
			}
			defer func() {
				if err := f.Close(); err != nil {
					panic(err)
				}
			}()

			_, err = io.Copy(f, rc)
			if err != nil {
				return err
			}
		}
		return nil
	}

	for _, f := range r.File {
		err := extractAndWriteFile(f)
		if err != nil {
			return err
		}
	}

	return nil
}

func FileCopy(src, dst string) (int64, error) {
	src_file, err := os.Open(src)
	if err != nil {
		return 0, err
	}
	defer src_file.Close()

	src_file_stat, err := src_file.Stat()
	if err != nil {
		return 0, err
	}

	if !src_file_stat.Mode().IsRegular() {
		return 0, fmt.Errorf("%s is not a regular file", src)
	}

	dst_file, err := os.Create(dst)
	if err != nil {
		return 0, err
	}
	defer dst_file.Close()
	return io.Copy(dst_file, src_file)
}
