import React, { Component } from 'react';
import {
    Grid, Row, Col,
    FormGroup, ControlLabel, FormControl
} from 'react-bootstrap';

import NotificationSystem from 'react-notification-system';
import {Card} from '../../components/Card/Card.jsx';
import Button from '../../elements/CustomButton/CustomButton.jsx';

import {style} from "../../variables/Variables.jsx";


class UserProfile extends Component {
    constructor(props){
        super(props);

        var prx = localStorage.getItem('proxies') || '';

        this.state = {
            textArea: prx.split(",").join('\n'),
        };

        this.saveProxies = this.saveProxies.bind(this);
        this.clearTextArea = this.clearTextArea.bind(this);
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

    saveProxies(event) {
        var prx = this.state.textArea.split('\n')
        var validPrx = [];
        for(var i=0; i < prx.length; i++) {
            prx[i] = prx[i].trim();
            if (prx[i] !== '') {
                validPrx.push(prx[i]);
            }
        }
        localStorage.setItem('proxies', validPrx);
        this.showMessage('success', 'Proxies saved');
        event.preventDefault();
    }

    clearTextArea() {
        localStorage.setItem('proxies', '');
        this.setState({textArea: ''});
    }

    handleChangeTextArea(event) {
        this.setState({textArea: event.target.value});
    }

    render() {
        return (
            <div className="content">
                <NotificationSystem ref="notificationSystem" style={style}/>
                <Grid fluid>
                    <Row>
                        <Col md={8}>
                            <Card
                                title="Add proxy list"
                                content={
                                    <form onSubmit={this.saveProxies}>
                                        Add your proxies using this format, one per line:
                                        <ul>
                                            <li>http://192.168.0.0.1:80</li>
                                            <li>socks5://192.168.0.0.1:8080</li>
                                        </ul>
                                        <Row>
                                            <Col md={12}>
                                                <FormGroup controlId="formControlsTextarea">
                                                    <ControlLabel>About Me</ControlLabel>
                                                    <FormControl rows="5" componentClass="textarea" bsClass="form-control" value={this.state.textArea} placeholder="Proxy list" onChange={this.handleChangeTextArea.bind(this)}/>
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                        <Button onClick={this.clearTextArea}>
                                            Clear
                                        </Button>

                                        <Button
                                            bsStyle="info"
                                            pullRight
                                            fill
                                            type="submit"
                                        >
                                            Save
                                        </Button>
                                        <div className="clearfix"></div>
                                    </form>
                                }
                            />
                        </Col>

                    </Row>
                </Grid>>
            </div>
        );
    }
}

export default UserProfile;
