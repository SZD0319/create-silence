import { useRoutes } from "react-router-dom";
import { lazy, Suspense } from "react";

const App = lazy(() => import(/* webpackChunkName: "app" */ "../App"));
const Home = lazy(() => import(/* webpackChunkName: "home" */ "../views/Home"));

export const routeList = [
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
