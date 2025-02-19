import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import Routes from "@/router";

const root = createRoot(document.getElementById("root")!);
root.render(
    <BrowserRouter>
        <Routes />
    </BrowserRouter>
);
