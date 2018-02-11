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

import AceEditor from 'react-ace';
import brace from 'brace';
import 'brace/theme/github';


import axios from 'axios';

class Script extends Component{
    constructor(props){
        super(props);

        this.state = {
            started: false,
            url: localStorage.getItem('urlScript') || '',
            script: localStorage.getItem('scriptScript') || 'console.log(msg.url);\nconsole.log(page);',
            hostname: window.location.hostname,
        }

        this.startJob = this.startJob.bind(this);
        this.saveScript = this.saveScript.bind(this);
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
        axios.post('http://' + this.state.hostname + ':3002/script/test', {
            url: this.state.url,
            script: this.state.script,
          })
          .then(function (response) {
            self.showMessage('success', "Test success");
            self.setState({started: false});
          })
          .catch(function (error) {
            console.log(error);
            self.showMessage('error', error.data);
            self.setState({started: false});
          });
        this.setState({started: true});
        self.showMessage('info', "Test started");
        event.preventDefault();
    }

    handleChangeURL(event) {
        localStorage.setItem('urlScript', event.target.value);
        this.setState({url: event.target.value});
    }

    handleChangeScript(value) {
        this.setState({script: value});
    }

    saveScript() {
        localStorage.setItem('scriptScript', this.state.script);
        this.showMessage('success', "Script saved");
    }


    render() {
        return (
            <div className="content">
                <NotificationSystem ref="notificationSystem" style={style}/>
                <Grid fluid>
                    <Row>
                        <Col sm={4}>
                            <Card
                                title="Test your code (Advanced mode)"
                                content={
                                <div>
                                    <p>Custom code is used to decie how the bot behaves on the page. All PhantomJS functionalities are available. The object page represent your page, the object msg.url is your entry url. You cannot send other parameters for now. Use response.closeGracefully(); to close gracefuly your request.</p>
                                    <p>Use the test function to test your code on a page</p>
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
                                        <Button bsStyle="info" fill type="submit" disabled={this.state.started}>Live Test</Button>
                                        <span>&nbsp;</span>
                                        <Button bsStyle="success" fill type="button" disabled={this.state.started} onClick={this.saveScript}>Save Code</Button>
                                        <div className="clearfix"></div>
                                    </form>
                                    </div>
                                }
                            />
                        </Col>
                        <Col sm={8}>
                            <AceEditor
                                mode="javascript"
                                theme="github"
                                onChange={this.handleChangeScript.bind(this)}
                                fontSize={14}
                                showPrintMargin={true}
                                showGutter={true}
                                highlightActiveLine={true}
                                value={this.state.script}
                                setOptions={{
                                enableBasicAutocompletion: false,
                                enableLiveAutocompletion: true,
                                enableSnippets: false,
                                showLineNumbers: true,
                                tabSize: 2,
                            }}/>
                        </Col>
                    </Row>
                </Grid>
            </div>
        );
    }

}

export default Script;
