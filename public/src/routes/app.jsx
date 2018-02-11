import Dashboard from '../views/Dashboard/Dashboard';
import UserProfile from '../views/UserProfile/UserProfile';
import TableList from '../views/TableList/TableList';
import Typography from '../views/Typography/Typography';
import Icons from '../views/Icons/Icons';
import Maps from '../views/Maps/Maps';
import Debug from '../views/Debug/Debug';
import Script from '../views/Script/Script';
import Notifications from '../views/Notifications/Notifications';

const appRoutes = [
    { path: "/dashboard", name: "Dashboard", icon: "pe-7s-graph", component: Dashboard },
    { path: "/proxies", name: "Proxies", icon: "pe-7s-user", component: UserProfile },
    { path: "/debug", name: "Debug", icon: "pe-7s-science", component: Debug },
    { path: "/script", name: "Script", icon: "pe-7s-note2", component: Script },
    /*{ path: "/table", name: "Table List", icon: "pe-7s-note2", component: TableList },
    { path: "/typography", name: "Typography", icon: "pe-7s-news-paper", component: Typography },
    { path: "/icons", name: "Icons", icon: "pe-7s-science", component: Icons },
    { path: "/maps", name: "Maps", icon: "pe-7s-map-marker", component: Maps },
    { path: "/notifications", name: "Notifications", icon: "pe-7s-bell", component: Notifications },*/
    { redirect: true, path:"/", to:"/dashboard", name: "Dashboard" }
];

export default appRoutes;
