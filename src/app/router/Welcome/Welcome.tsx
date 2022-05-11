import { useEffect, useState } from "react";
import { HashRouter as Router, useRoutes, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "~/i18n/i18nConfig";

import { AuthProvider } from "~/app/context/AuthContext";
import connectorRoutes from "~/app/router/connectorRoutes";
import type { Step } from "@components/Steps";
import DevMenu from "@components/DevMenu";
import Steps from "@components/Steps";
import Intro from "@screens/Onboard/Intro";
import SetPassword from "@screens/Onboard/SetPassword";
import ChooseConnector from "@screens/connectors/ChooseConnector";
import TestConnection from "@screens/Onboard/TestConnection";
import LocaleSwitcher from "@components/LocaleSwitcher/LocaleSwitcher";

const namespaceI18n = { ns: "welcome" };

const routes = [
  { path: "/", element: <Intro />, name: i18n.t("nav.welcome", namespaceI18n) },
  {
    path: "/set-password",
    element: <SetPassword />,
    name: i18n.t("nav.password", namespaceI18n),
  },
  {
    path: "/choose-connector",
    name: i18n.t("nav.connect", namespaceI18n),
    children: [
      {
        index: true,
        element: (
          <ChooseConnector
            title={i18n.t("choose_connector.title", namespaceI18n)}
            description={i18n.t("choose_connector.description", namespaceI18n)}
          />
        ),
      },
      ...connectorRoutes,
    ],
  },
  {
    path: "/test-connection",
    element: <TestConnection />,
    name: i18n.t("nav.done", namespaceI18n),
  },
];

const initialSteps: Step[] = routes.map((route) => ({
  id: route.name,
  status: "upcoming",
}));

function WelcomeRouter() {
  return (
    <Router>
      <App />
    </Router>
  );
}

function App() {
  const [steps, setSteps] = useState(initialSteps);
  const { t } = useTranslation(["welcome"]);
  const location = useLocation();
  const routesElement = useRoutes(routes);

  // Update step progress based on active location.
  useEffect(() => {
    const { pathname } = location;
    let activeStepIndex = 0;
    routes.forEach((route, index) => {
      if (pathname.includes(route.path)) activeStepIndex = index;
    });
    const updatedSteps = initialSteps.map((step, index) => {
      let status: Step["status"] = "upcoming";
      if (index < activeStepIndex) {
        status = "complete";
      } else if (index === activeStepIndex) {
        status = "current";
      }
      return { ...step, status };
    });
    setSteps(updatedSteps);
  }, [location]);

  return (
    <AuthProvider>
      <div>
        {process.env.NODE_ENV === "development" && (
          <>
            <DevMenu />
            <div className="w-32 mr-4 mt-1 pt-3 float-right">
              <LocaleSwitcher />
            </div>
          </>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center font-serif font-medium text-2xl pt-7 pb-3 dark:text-white">
            <p>{t("heading")}</p>
          </div>

          <Steps steps={steps} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {routesElement}
        </div>
      </div>
    </AuthProvider>
  );
}

export default WelcomeRouter;
