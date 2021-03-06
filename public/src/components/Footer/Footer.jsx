import React, {Component} from 'react';
import { Grid } from 'react-bootstrap';

class Footer extends Component {
	render() {
		return (
            <footer className="footer">
                <Grid>
                    <p className="copyright pull-right">
                        &copy; {(new Date()).getFullYear()} <a href="/">Pinger</a>
                    </p>
                </Grid>
            </footer>
		);
	}
}

export default Footer;
