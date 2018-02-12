# Pinger

A simple page viewer using PhantomJS. The main goal was to try pakaging files, using an auto updater and handle PhantomJS with Go.

![Main](https://s3-us-west-2.amazonaws.com/pierre-luc-gagnons/dashboard.png)

## Features

- Works on windows, linux, mac
- Multi thread
- Render javascript
- Work with proxies (http or socks5)
- Auto update (mac and linux only)
- On/off image loading
- PhantomJS engine
- Debug any page quickly
- Custom code possible
- Web interface, can be used on any VPS

## Install

Download the binary file from release section and simply run it. It will handle PhantomJS download by itself. 

## Install dev

Run the following commands:
- `go get -u github.com/gobuffalo/packr/...`
- `go get ./...`
- `cd public && npm intall`
- `make`
- `go run main.go`

## Dev

- You can use `npm start` to have auto reload
- Use `go run main.go -d` to run debug mode