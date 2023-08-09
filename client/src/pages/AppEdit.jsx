import { useEffect, useState, useRef } from "react";
import { axios } from "../data/axios";
import { useNavigate, useParams } from "react-router-dom";
import { AppNameEditor } from "../components/apps/AppNameEditor";
import {
  EditSharingModal,
  PublishModal,
  UnpublishModal,
} from "../components/apps/AppPublisher";
import PublishedWithChangesIcon from "@mui/icons-material/PublishedWithChanges";
import { enqueueSnackbar } from "notistack";
import {
  Alert,
  AlertTitle,
  AppBar,
  Box,
  Button,
  CircularProgress,
  Grid,
  Link,
  Paper,
  Stack,
  SvgIcon,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import PreviewIcon from "@mui/icons-material/Preview";
import TimelineIcon from "@mui/icons-material/Timeline";
import UnpublishedIcon from "@mui/icons-material/Unpublished";
import { useRecoilValue } from "recoil";
import { profileState, profileFlagsState } from "../data/atoms";
import AppBuilderTour from "../components/apps/AppBuilderTour";
import AppVisibilityIcon from "../components/apps/AppVisibilityIcon";
import AppEditorMenu from "../components/apps/AppEditorMenu";
import { AppEditor } from "../components/apps/AppEditor";
import { AppPreview } from "../components/apps/AppPreview";
import { AppRunHistory } from "../components/apps/AppRunHistory";
import { AppWebConfigEditor } from "../components/apps/AppWebConfigEditor";
import { AppSlackConfigEditor } from "../components/apps/AppSlackConfigEditor";
import { AppDiscordConfigEditor } from "../components/apps/AppDiscordConfigEditor";
import { ReactComponent as CodeIcon } from "../assets/images/icons/code.svg";
import { ReactComponent as DiscordIcon } from "../assets/images/icons/discord.svg";
import { ReactComponent as IntegrationsIcon } from "../assets/images/icons/integrations.svg";
import { ReactComponent as SlackIcon } from "../assets/images/icons/slack.svg";
import { ReactComponent as TemplateIcon } from "../assets/images/icons/template.svg";
import { ReactComponent as TestsIcon } from "../assets/images/icons/tests.svg";
import { ReactComponent as WebIcon } from "../assets/images/icons/web.svg";
import { AppApiExamples } from "../components/apps/AppApiExamples";
import { AppTemplate } from "../components/apps/AppTemplate";
import { AppTests } from "../components/apps/AppTests";

const menuItems = [
  {
    name: "Editor",
    value: "editor",
    icon: <EditIcon />,
  },
  {
    name: "Preview",
    value: "preview",
    icon: <PreviewIcon />,
  },
  {
    name: "History",
    value: "history",
    icon: <TimelineIcon />,
  },
  {
    name: "Tests",
    value: "tests",
    icon: <SvgIcon component={TestsIcon} />,
  },
  {
    name: "Integrations",
    icon: <SvgIcon component={IntegrationsIcon} />,
    children: [
      {
        name: "Website",
        value: "integrations/website",
        icon: <SvgIcon component={WebIcon} />,
      },
      {
        name: "API",
        value: "integrations/api",
        icon: <SvgIcon component={CodeIcon} />,
      },
      {
        name: "Discord",
        value: "integrations/discord",
        icon: <SvgIcon component={DiscordIcon} />,
      },
      {
        name: "Slack",
        value: "integrations/slack",
        icon: <SvgIcon component={SlackIcon} />,
      },
    ],
  },
];

export default function AppEditPage(props) {
  const { appId } = useParams();
  const { page } = props;
  const [appInputUiSchema, setAppInputUiSchema] = useState({});
  const [app, setApp] = useState(null);
  const [isPublished, setIsPublished] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showSharingModal, setShowSharingModal] = useState(false);
  const [showUnpublishModal, setShowUnpublishModal] = useState(false);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [appTemplate, setAppTemplate] = useState(null);
  const [appInputSchema, setAppInputSchema] = useState({});
  const [appOutputTemplate, setAppOutputTemplate] = useState({});
  const [missingKeys, setMissingKeys] = useState([]);
  const [appVisibility, setAppVisibility] = useState(3);
  const [selectedMenuItem, setSelectedMenuItem] = useState(page || "editor");
  const profile = useRecoilValue(profileState);
  const profileFlags = useRecoilValue(profileFlagsState);
  const tourRef1 = useRef(null);
  const tourRef2 = useRef(null);
  const tourRef3 = useRef(null);
  const tourRef4 = useRef(null);
  const tourRef5 = useRef(null);
  const tourRef6 = useRef(null);

  useEffect(() => {
    if (appId) {
      axios()
        .get(`/api/apps/${appId}`)
        .then((response) => {
          const app = response.data;
          setIsLoading(false);
          setApp(app);

          setIsPublished(app.is_published);
          setAppInputSchema(
            app.input_schema && Object.keys(app.input_schema).length > 0
              ? app.input_schema
              : {
                  type: "object",
                  properties: {
                    question: {
                      type: "string",
                      title: "Question",
                      description: "Enter your question here",
                    },
                  },
                },
          );
          setAppOutputTemplate(app.output_template);
          setAppInputUiSchema(app.input_ui_schema || {});
          setAppVisibility(app.visibility);

          if (app?.template) {
            setSelectedMenuItem(page || "template");
            axios()
              .get(`/api/apps/templates/${response.data.template.slug}`)
              .then((response) => {
                setAppTemplate(response.data);
              });
          }
        })
        .catch((error) => {
          window.location.href = "/apps";
        });
    }
  }, [appId, page]);

  useEffect(() => {
    let missingKeys = new Set();
    app?.processors
      ?.map((processor) => {
        return [
          processor.apiBackend?.api_provider?.slug,
          processor.apiBackend?.api_provider?.name,
        ];
      })
      .forEach(([slug, name]) => {
        if (slug === "promptly") {
          if (!profile.openai_key) {
            missingKeys = missingKeys.add("Open AI");
          }
        } else {
          if (!profile[`${slug}_key`]) missingKeys = missingKeys.add(name);
        }
      });

    setMissingKeys(Array.from(missingKeys));
  }, [app?.processors, profile]);

  useEffect(() => {
    setApp((app) => ({ ...app, input_schema: appInputSchema }));
  }, [appInputSchema]);

  useEffect(() => {
    setApp((app) => ({ ...app, input_ui_schema: appInputUiSchema }));
  }, [appInputUiSchema]);

  useEffect(() => {
    setApp((app) => ({ ...app, output_template: appOutputTemplate }));
  }, [appOutputTemplate]);

  const createApp = (app) => {
    return new Promise((resolve, reject) => {
      axios()
        .post("/api/apps", app)
        .then((response) => {
          enqueueSnackbar("App created successfully", {
            variant: "success",
            autoHideDuration: 500,
          });
          navigate(`/apps/${response.data.uuid}`);
          resolve(response);
        })
        .catch((error) => reject(error));
    });
  };

  const saveApp = () => {
    return new Promise((resolve, reject) => {
      const updatedApp = {
        name: app?.name,
        description: "",
        config: app?.config,
        app_type: app?.type?.id,
        input_schema: appInputSchema,
        input_ui_schema: appInputUiSchema,
        output_template: appOutputTemplate,
        web_config: app?.web_config || {},
        slack_config: app?.slack_config || {},
        discord_config: app?.discord_config || {},
        processors: app?.processors.map((processor) => ({
          api_backend: processor.api_backend.id,
          config: processor.config,
          input: processor.input,
          endpoint: processor.endpoint?.uuid || processor.endpoint,
        })),
      };

      if (appId) {
        axios()
          .patch(`/api/apps/${appId}`, updatedApp)
          .then((response) => {
            setApp(response.data);
            enqueueSnackbar("App updated successfully", { variant: "success" });
            resolve(response.data);
          })
          .catch((error) => reject(error));
      } else {
        createApp(updatedApp)
          .then((response) => resolve(response.data))
          .catch((error) => reject(error));
      }
    });
  };

  return isLoading ? (
    <CircularProgress />
  ) : (
    <div id="app-edit-page" style={{ margin: 10 }}>
      <AppBuilderTour
        tourRef1={tourRef1}
        tourRef2={tourRef2}
        tourRef3={tourRef3}
        tourRef4={tourRef4}
        tourRef5={tourRef5}
        tourRef6={tourRef6}
        page={selectedMenuItem}
      />
      <AppBar
        position="sticky"
        sx={{ backgroundColor: "inherit", zIndex: 100 }}
        ref={tourRef1}
      >
        {app?.type && (
          <Paper
            elevation={1}
            style={{
              width: "100%",
              padding: "10px 20px",
            }}
          >
            <Stack direction="row" spacing={1}>
              <Stack direction="column">
                <Stack direction="row" spacing={1.2}>
                  <AppNameEditor
                    appName={app.name}
                    setAppName={(newAppName) =>
                      setApp((app) => ({
                        ...app,
                        name: newAppName,
                      }))
                    }
                  />
                  {app.owner_email !== profile.user_email && (
                    <span style={{ color: "gray", lineHeight: "40px" }}>
                      shared by <b>{app.owner_email}</b>
                    </span>
                  )}
                  {app.owner_email === profile.user_email &&
                    app.visibility === 0 &&
                    app.last_modified_by_email && (
                      <span style={{ color: "gray", lineHeight: "40px" }}>
                        Last modified by{" "}
                        <b>
                          {app.last_modified_by_email === profile.user_email
                            ? "You"
                            : app.last_modified_by_email}
                        </b>
                      </span>
                    )}
                </Stack>
                {isPublished && (
                  <Stack
                    direction="row"
                    spacing={0.2}
                    sx={{ justifyContent: "left" }}
                  >
                    <Link
                      href={`${window.location.origin}/app/${app.published_uuid}`}
                      target="_blank"
                      rel="noreferrer"
                      variant="body2"
                    >
                      {`${window.location.origin}/app/${app.published_uuid}`}
                    </Link>
                    <AppVisibilityIcon
                      visibility={appVisibility}
                      published={isPublished}
                      setShowSharingModal={setShowSharingModal}
                      disabled={app.owner_email !== profile.user_email}
                    />
                  </Stack>
                )}
              </Stack>
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  justifyContent: "flex-end",
                  flexGrow: 1,
                  flexShrink: 1,
                  alignItems: "center",
                }}
              >
                <EditSharingModal
                  show={showSharingModal}
                  setShow={setShowSharingModal}
                  app={app}
                  setIsPublished={setIsPublished}
                  setAppVisibility={setAppVisibility}
                />
                <PublishModal
                  show={showPublishModal}
                  setShow={setShowPublishModal}
                  app={app}
                  setIsPublished={setIsPublished}
                  setAppVisibility={setAppVisibility}
                />
                <UnpublishModal
                  show={showUnpublishModal}
                  setShow={setShowUnpublishModal}
                  app={app}
                  setIsPublished={setIsPublished}
                />
                {appId && app && (
                  <Button
                    variant="contained"
                    color="success"
                    style={{ textTransform: "none" }}
                    disabled={app.owner_email !== profile.user_email}
                    startIcon={
                      isPublished ? (
                        <UnpublishedIcon />
                      ) : (
                        <PublishedWithChangesIcon />
                      )
                    }
                    onClick={() =>
                      isPublished
                        ? setShowUnpublishModal(true)
                        : setShowPublishModal(true)
                    }
                  >
                    {isPublished ? "Unpublish" : "Publish"}
                  </Button>
                )}
              </Stack>
            </Stack>
          </Paper>
        )}
      </AppBar>
      <Stack>
        <p></p>
        {false &&
          missingKeys.length > 0 &&
          !profileFlags.IS_ORGANIZATION_MEMBER && (
            <Alert
              severity="error"
              style={{ width: "100%", margin: "10px 0", textAlign: "left" }}
            >
              <AlertTitle>Missing API Keys</AlertTitle>
              <p>
                You are missing API keys for the following providers:{" "}
                <strong>{missingKeys.join(", ")}</strong>. Please add them in
                your <Link href="/settings">profile</Link> to use these
                processors in your app successfully. If you don't have an API
                key for a provider, you can get one from their websites. For
                example by visiting{" "}
                <Link
                  href="https://platform.openai.com/account/api-keys"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open AI
                </Link>
                ,{" "}
                <Link
                  href="https://beta.dreamstudio.ai/membership?tab=apiKeys"
                  target="_blank"
                  rel="noreferrer"
                >
                  Dream Studio
                </Link>{" "}
                etc.
              </p>
            </Alert>
          )}
      </Stack>
      <Grid
        container
        sx={{ maxWidth: "1200px !important", margin: "auto" }}
        rowSpacing={1}
        columnSpacing={{ xs: 0, sm: 1 }}
      >
        <Grid item md={3} xs={12}>
          <Box sx={{ width: "100%" }}>
            <AppEditorMenu
              menuItems={
                appTemplate
                  ? [
                      {
                        name: appTemplate.name,
                        value: "template",
                        icon: <SvgIcon component={TemplateIcon} />,
                      },
                      ...menuItems,
                    ]
                  : menuItems
              }
              selectedMenuItem={selectedMenuItem}
              setSelectedMenuItem={(value) => {
                setSelectedMenuItem(value);
                navigate(`/apps/${appId}/${value}`);
              }}
              tourRef={tourRef6}
            />
          </Box>
        </Grid>
        <Grid item md={9} xs={12}>
          <Box sx={{ alignSelf: "flex-start" }}>
            {selectedMenuItem === "editor" && (
              <AppEditor
                processors={app?.processors || []}
                setProcessors={(newProcessors) =>
                  setApp((app) => ({ ...app, processors: newProcessors }))
                }
                appConfig={app?.config || {}}
                setAppConfig={(newConfig) =>
                  setApp((app) => ({ ...app, config: newConfig }))
                }
                appInputSchema={appInputSchema}
                setAppInputSchema={setAppInputSchema}
                appInputUiSchema={appInputUiSchema}
                setAppInputUiSchema={setAppInputUiSchema}
                appOutputTemplate={appOutputTemplate}
                setAppOutputTemplate={setAppOutputTemplate}
                app={app}
                setApp={setApp}
                saveApp={saveApp}
                tourInputRef={tourRef2}
                tourChainRef={tourRef3}
                tourOutputRef={tourRef4}
                tourSaveRef={tourRef5}
              />
            )}
            {selectedMenuItem === "preview" && <AppPreview app={app} />}
            {selectedMenuItem === "history" && <AppRunHistory app={app} />}
            {selectedMenuItem === "tests" && <AppTests app={app} />}
            {selectedMenuItem === "integrations/website" && (
              <AppWebConfigEditor
                app={app}
                webConfig={app?.web_config || {}}
                setWebConfig={(webConfig) => {
                  setApp((app) => ({ ...app, web_config: webConfig }));
                }}
                saveApp={saveApp}
              />
            )}
            {selectedMenuItem === "integrations/slack" && (
              <AppSlackConfigEditor
                app={app}
                slackConfig={app?.slack_config || {}}
                setSlackConfig={(slackConfig) => {
                  setApp((app) => ({ ...app, slack_config: slackConfig }));
                }}
                saveApp={saveApp}
              />
            )}
            {selectedMenuItem === "integrations/discord" && (
              <AppDiscordConfigEditor
                app={app}
                discordConfig={app?.discord_config || {}}
                setDiscordConfig={(discordConfig) => {
                  setApp((app) => ({ ...app, discord_config: discordConfig }));
                }}
                saveApp={saveApp}
              />
            )}
            {selectedMenuItem === "integrations/api" && (
              <AppApiExamples app={app} />
            )}
            {selectedMenuItem === "template" && (
              <AppTemplate
                app={app}
                setApp={setApp}
                appTemplate={appTemplate}
                saveApp={saveApp}
              />
            )}
          </Box>
        </Grid>
      </Grid>
    </div>
  );
}