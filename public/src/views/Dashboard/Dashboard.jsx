import React, { Component } from 'react';
import { Grid, Row, Col, Button } from 'react-bootstrap';

import NotificationSystem from 'react-notification-system';
import {style} from "../../variables/Variables.jsx";

import {FormInputs} from '../../components/FormInputs/FormInputs.jsx';
import {Card} from '../../components/Card/Card.jsx';
import {StatsCard} from '../../components/StatsCard/StatsCard.jsx';

import axios from 'axios';

class Dashboard extends Component {
    constructor(props){
        super(props);

        this.state = {
            started: false,
            url: localStorage.getItem('url') || '',
            sleepTime: 4,
            threadCount: 1,
            requestCount: 1,
            requestTimeout: 0,
            totalReq: 0,
            failedReq: 0,
            successReq: 0,
            remainingReq: 0,
            proxies: (localStorage.getItem('proxies') || '').split(','),
            loadImages: true,
            userAgent: 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.85 Safari/537.36',
            hostname: window.location.hostname,
            useCustomCode: false,
        };

        if (this.state.proxies[0] === '') {
            this.state.proxies = [];
        }

        this.startJob = this.startJob.bind(this);
        this.createButton = this.createButton.bind(this);
        this.stopJob = this.stopJob.bind(this);
        this.checkStatus = this.checkStatus.bind(this);
        this.updateStats = this.updateStats.bind(this);
    }

    componentDidMount(){
        this.setState({_notificationSystem: this.refs.notificationSystem});

        var self = this;
        axios.get('http://' + this.state.hostname + ':3002/status')
          .then(function (response) {
             var data = response.data;
             if (data.Active) {
                self.setState({started: true});
                self.checkStatus();
             }
          })
          .catch(function (error) {
            console.log(error);
          });
    }

    showMessage(color, message, title) {
        var _notificationSystem = this.state._notificationSystem;
        _notificationSystem.addNotification({
            title: title,
            message: (
                <div>
                    {message}
                </div>
            ),
            level: color,
            position: "tr",
            autoDismiss: 4,
        });
    }

    createButton() {
        if (!this.state.started)
            return <Button bsStyle="info" fill type="submit">Start job</Button>

        if (this.state.started)
            return <a className="btn btn-danger" fill onClick={this.stopJob}>Stop</a>
    }

    
    startJob(event) {
        if (this.state.started)
            return;

        if (!this.state.url) {
            this.showMessage('error', 'Enter a valid URL');
            return;
        }

        if (this.state.sleepTime < 0) {
            this.showMessage('error', 'Enter a valid Sleep Time');
            return;
        }

        if (this.state.threadCount < 1) {
            this.showMessage('error', 'Enter a valid Thread Count');
            return;
        }
        console.log(typeof(this.state.loadImages))
        var self = this;
        axios.post('http://' + this.state.hostname + ':3002/start', {
            url: this.state.url,
            sleepTime: parseInt(this.state.sleepTime, 10),
            threadCount: parseInt(this.state.threadCount, 10),
            requestCount: parseInt(this.state.requestCount, 10),
            requestTimeout: parseInt(this.state.requestTimeout, 10),
            proxies: this.state.proxies,
            loadImages: this.state.loadImages,
            userAgent: this.state.userAgent,
            customScript: this.state.useCustomCode ? (localStorage.getItem('scriptScript') || '') : '',
          })
          .then(function (response) {
            self.setState({totalReq: parseInt(self.state.requestCount, 10)});
            self.showMessage('success', 'Job started successfully');
            self.checkStatus();
          })
          .catch(function (error) {
            console.log(error);
            self.showMessage('error', 'Job failed to start');
          });

        this.setState({started: true});
        event.preventDefault();
    }

    checkStatus() {
        var self = this;
        if (!this.state.started) {
          return;
        }

        axios.get('http://' + this.state.hostname + ':3002/status')
          .then(function (response) {
            var data = response.data;
            self.updateStats(data);
            if (self.state.totalReq - data.TotalReq === 0) {
                self.stopJob();
                return;
            }

            setTimeout(function(){self.checkStatus();}, 3000);
          })
          .catch(function (error) {
            console.log(error);
          });
    }

    stopJob() {
        var self = this;
        axios.get('http://' + this.state.hostname + ':3002/stop').then(function (response) {
            self.showMessage('success', 'Job stopped');
          })
          .catch(function (error) {
            console.log(error);
            self.showMessage('error', 'Job failed to stop');
          });
        this.setState({started: false});
    }

    updateStats(data) {
        this.setState({
            failedReq: data.FailedReq,
            successReq: data.SuccessReq,
            remainingReq:  this.state.totalReq - data.TotalReq,
            totalReq: data.MaxReq,
        });
    }

    handleChangeURL(event) {
        localStorage.setItem('url', event.target.value);
        this.setState({url: event.target.value});
    }

    handleChangeThreadCount(event) {
        this.setState({threadCount: event.target.value});
    }

    handleChangeSleepTime(event) {
        this.setState({sleepTime: event.target.value});
    }

    handleChangeRequestCount(event) {
        this.setState({requestCount: event.target.value});
    }

    handleChangeRequestTimeout(event) {
        this.setState({requestTimeout: event.target.value});
    }

    handleChangeLoadImages(event) {
        this.setState({loadImages: !this.state.loadImages});
    }

    handleChangeUserAgent(event) {
        this.setState({userAgent: event.target.value});
    }

    handleChangeUseCustomCode(event) {
        this.setState({useCustomCode: !this.state.useCustomCode});
    }

    render() {
        return (
            <div className="content">
            <NotificationSystem ref="notificationSystem" style={style}/>
                <Grid fluid>
                    <Row>
                        <Col lg={3} sm={6}>
                            <StatsCard
                                bigIcon={<i className="pe-7s-server text-warning"></i>}
                                statsText="Remaining"
                                statsValue={this.state.remainingReq}
                                //statsIcon={<i className="fa fa-refresh"></i>}
                                //statsIconText="Updated now"
                            />
                        </Col>
                        <Col lg={3} sm={6}>
                            <StatsCard
                                bigIcon={<i className="pe-7s-wallet text-success"></i>}
                                statsText="Success"
                                statsValue={this.state.successReq}
                                //statsIcon={<i className="fa fa-calendar-o"></i>}
                                //statsIconText="Last day"
                            />
                        </Col>
                        <Col lg={3} sm={6}>
                            <StatsCard
                                bigIcon={<i className="pe-7s-graph1 text-danger"></i>}
                                statsText="Errors"
                                statsValue={this.state.failedReq}
                                //statsIcon={<i className="fa fa-clock-o"></i>}
                                //statsIconText="In the last hour"
                            />
                        </Col>
                        <Col lg={3} sm={6}>
                            <StatsCard
                                bigIcon={<i className="fa fa-twitter text-info"></i>}
                                statsText="Proxies"
                                statsValue={this.state.proxies.length}
                                //statsIcon={<i className="fa fa-refresh"></i>}
                                //statsIconText="Updated now"
                            />
                        </Col>
                    </Row>
                    <Row>
                        <Col md={8}>
                            <Card
                                title="Create job"
                                content={
                                    <form onSubmit={this.startJob}>
                                        <FormInputs
                                            ncols = {["col-md-5" , "col-md-3" , "col-md-4"]}
                                            proprieties = {[
                                                {
                                                 label : "URL",
                                                 type : "text",
                                                 bsClass : "form-control",
                                                 placeholder : "http://example.com/",
                                                 disabled: this.state.started,
                                                 value: this.state.url,
                                                 onChange: this.handleChangeURL.bind(this),
                                                },
                                                {
                                                 label : "Sleep time (s)",
                                                 type : "number",
                                                 bsClass : "form-control",
                                                 placeholder : "seconds",
                                                 disabled: this.state.started,
                                                 value: this.state.sleepTime,
                                                 onChange: this.handleChangeSleepTime.bind(this),
                                                },
                                                {
                                                 label : "Thread count",
                                                 type : "number",
                                                 bsClass : "form-control",
                                                 placeholder : "count",
                                                 disabled: this.state.started,
                                                 value: this.state.threadCount,
                                                 onChange: this.handleChangeThreadCount.bind(this),
                                                }
                                            ]}
                                        />
                                        <FormInputs
                                            ncols = {["col-md-5", "col-md-3", "col-md-4"]}
                                            proprieties = {[
                                                {
                                                 label : "Engine",
                                                 type : "text",
                                                 bsClass : "form-control",
                                                 value : "PhantomJS",
                                                 disabled: true,
                                                },
                                                {
                                                 label : "Request Count",
                                                 type : "number",
                                                 bsClass : "form-control",
                                                 placeholder : "count",
                                                 disabled: this.state.started,
                                                 value: this.state.requestCount,
                                                 onChange: this.handleChangeRequestCount.bind(this),
                                                },
                                                {
                                                 label : "Request Timeout",
                                                 type : "number",
                                                 bsClass : "form-control",
                                                 placeholder : "count",
                                                 disabled: this.state.started,
                                                 value: this.state.requestTimeout,
                                                 onChange: this.handleChangeRequestTimeout.bind(this),
                                                },
                                            ]}
                                        />
                                        <FormInputs
                                            ncols = {["col-md-5", "col-md-7"]}
                                            proprieties = {[
                                                {
                                                 label : "Enable image loading",
                                                 type : "checkbox",
                                                 bsClass : "form-control",
                                                 defaultChecked: true,
                                                 value : this.state.loadImages,
                                                 disabled: this.state.started,
                                                 onChange: this.handleChangeLoadImages.bind(this),
                                                },
                                                {
                                                 label : "User Agent",
                                                 type : "text",
                                                 bsClass : "form-control",
                                                 value : this.state.userAgent,
                                                 disabled: this.state.started,
                                                 onChange: this.handleChangeUserAgent.bind(this),
                                                }
                                            ]}
                                        />
                                        <FormInputs
                                            ncols = {["col-md-5"]}
                                            proprieties = {[
                                                {
                                                 label : "Use custom code",
                                                 type : "checkbox",
                                                 bsClass : "form-control",
                                                 defaultChecked: false,
                                                 value : this.state.useCustomCode,
                                                 disabled: this.state.started,
                                                 onChange: this.handleChangeUseCustomCode.bind(this),
                                                }
                                            ]}
                                        />
                                        {this.createButton()}
                                        <div className="clearfix"></div>
                                    </form>
                                }
                            />
                        </Col>
                        <Col md={4}>
                          <Card
                                title="Debug the page"
                                content={
                                  <div className="text-center">
                                    <p>Check what your page looks like in the browser</p>
                                    <p></p>
                                    <a className="btn" href="#/debug">
                                      Try it
                                    </a>
                                  </div>
                                }
                          />
                        </Col>
                    </Row>

                </Grid>
            </div>
        );
    }
}

export default Dashboard;
