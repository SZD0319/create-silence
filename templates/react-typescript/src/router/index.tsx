import { lazy, Suspense } from "react";
import { useRoutes } from "react-router-dom";
import type { RouteObject } from "react-router-dom";

const App = lazy(() => import(/* webpackChunkName: "app" */ "../App"));
const Home = lazy(() => import(/* webpackChunkName: "home" */ "../views/Home"));

export const routeList: Array<RouteObject> = [
    {
        path: "/",
        element: <App />,
        children: [
            {
                id: "home",
                index: true,
                element: <Home />
            }
        ]
    }
];

export default function Routes() {
    const routes = useRoutes(routeList);

    return <Suspense fallback="">{routes}</Suspense>;
}
