import React, { Component } from 'react';

import {
    Grid, Row, Col,
    FormGroup, ControlLabel, FormControl
} from 'react-bootstrap';

import NotificationSystem from 'react-notification-system';
import {Card} from '../../components/Card/Card.jsx';

import {FormInputs} from '../../components/FormInputs/FormInputs.jsx';
import Button from '../../elements/CustomButton/CustomButton.jsx';
import {style} from "../../variables/Variables.jsx";

import axios from 'axios';

class Debug extends Component{
    constructor(props){
        super(props);

        this.state = {
            started: false,
            url: localStorage.getItem('urlDebug') || '',
            proxy: localStorage.getItem('proxyDebug') || '',
            userAgent: 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.85 Safari/537.36',
            loadImages: true,
            hostname: window.location.hostname,
        }

        this.startJob = this.startJob.bind(this);
    }

    componentDidMount(){
        this.setState({_notificationSystem: this.refs.notificationSystem});
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

    startJob(event) {
        var self = this;
        axios.post('http://' + this.state.hostname + ':3002/debug', {
            url: this.state.url,
            proxy: this.state.proxy,
            loadImages: this.state.loadImages,
            userAgent: this.state.userAgent,
          })
          .then(function (response) {
            self.showMessage('success', "Test success");
            self.setImage();
            self.setState({started: false});
          })
          .catch(function (error) {
            console.log(error);
            self.showMessage('error', "Test failed");
            self.setState({started: false});
          });
        this.setState({started: true});
        self.showMessage('info', "Test started");
        event.preventDefault();
    }

    setImage() {
        return <img src={"http://" + this.state.hostname + ":3002/debug/file.png?" + new Date().getTime()} />
    }

    handleChangeURL(event) {
        localStorage.setItem('urlDebug', event.target.value);
        this.setState({url: event.target.value});
    }

    handleChangeProxy(event) {
        localStorage.setItem('proxyDebug', event.target.value);
        this.setState({proxy: event.target.value});
    }

    handleChangeUserAgent(event) {
        this.setState({userAgent: event.target.value});
    }

    handleChangeLoadImages(event) {
        this.setState({loadImages: !this.state.loadImages});
    }

    render() {
        return (
            <div className="content">
                <NotificationSystem ref="notificationSystem" style={style}/>
                <Grid fluid>
                    <Row>
                        <Col sm={4}>
                            <Card
                                title="Debug Page"
                                content={
                                <div>
                                    <p>Check what a page looks like before starting</p>
                                    <form onSubmit={this.startJob}>
                                        <FormInputs
                                            ncols = {["col-xs-12"]}
                                            proprieties = {[
                                                {
                                                 label : "URL",
                                                 type : "text",
                                                 bsClass : "form-control",
                                                 placeholder : "http://example.com/",
                                                 disabled: this.state.started,
                                                 value: this.state.url,
                                                 onChange: this.handleChangeURL.bind(this),
                                                }
                                            ]}
                                        />
                                        <FormInputs
                                            ncols = {["col-xs-12"]}
                                            proprieties = {[
                                                {
                                                 label : "Proxy",
                                                 type : "text",
                                                 bsClass : "form-control",
                                                 placeholder : "http://192.168.0.1:8080",
                                                 disabled: this.state.started,
                                                 value: this.state.proxy,
                                                 onChange: this.handleChangeProxy.bind(this),
                                                }
                                            ]}
                                        />
                                        <FormInputs
                                            ncols = {["col-xs-12"]}
                                            proprieties = {[
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
                                            ncols = {["col-xs-12"]}
                                            proprieties = {[
                                                {
                                                 label : "Enable image loading",
                                                 type : "checkbox",
                                                 bsClass : "form-control",
                                                 defaultChecked: true,
                                                 value : this.state.loadImages,
                                                 disabled: this.state.started,
                                                 onChange: this.handleChangeLoadImages.bind(this),
                                                }
                                            ]}
                                        />
                                        <Button bsStyle="info" fill type="submit" disabled={this.state.started}>Test</Button>
                                        <div className="clearfix"></div>
                                    </form>
                                    </div>
                                }
                            />
                        </Col>
                        <Col sm={8}>
                            {this.setImage()}
                        </Col>
                    </Row>
                </Grid>
            </div>
        );
    }

}

export default Debug;
