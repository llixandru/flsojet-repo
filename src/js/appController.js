/**
 * @license
 * Copyright (c) 2014, 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
/*
 * Your application specific code will go here
 */
define(['knockout', 'ojs/ojcontext', 'ojs/ojmodule-element-utils', 'ojs/ojresponsiveutils', 'ojs/ojresponsiveknockoututils', 'ojs/ojcorerouter', 'ojs/ojmodulerouter-adapter', 'ojs/ojknockoutrouteradapter', 'ojs/ojurlparamadapter', 'ojs/ojarraydataprovider', 'ojs/ojknockouttemplateutils', 'env.config', 'ojs/ojmodule-element', 'ojs/ojknockout', 'ojs/ojselectsingle'],
    function(ko, Context, moduleUtils, ResponsiveUtils, ResponsiveKnockoutUtils, CoreRouter, ModuleRouterAdapter, KnockoutRouterAdapter, UrlParamAdapter, ArrayDataProvider, KnockoutTemplateUtils, config) {

        function ControllerViewModel() {

            this.KnockoutTemplateUtils = KnockoutTemplateUtils;

            // Handle announcements sent when pages change, for Accessibility.
            this.manner = ko.observable('polite');
            this.message = ko.observable();
            this.disabledMenu = ko.observable(true);

            announcementHandler = (event) => {
                this.message(event.detail.message);
                this.manner(event.detail.manner);
            };


            document.getElementById('globalBody').addEventListener('announce', announcementHandler, false);

            // Media queries for repsonsive layouts
            const smQuery = ResponsiveUtils.getFrameworkQuery(ResponsiveUtils.FRAMEWORK_QUERY_KEY.SM_ONLY);
            this.smScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(smQuery);

            let navData = [
                { path: '', redirect: 'login' },
                { path: 'dashboard', detail: { label: 'Dashboard', iconClass: 'oj-ux-ico-bar-chart' } },
                { path: 'login', detail: { label: 'Login', iconClass: 'oj-ux-ico-bar-chart' } }
            ];
            // Router setup
            this.router = new CoreRouter(navData, {
                urlAdapter: new UrlParamAdapter()
            });
            this.router.sync();

            this.moduleAdapter = new ModuleRouterAdapter(this.router);

            this.selection = new KnockoutRouterAdapter(this.router);

            // Setup the navDataProvider with the routes, excluding the first redirected
            // route.
            this.navDataProvider = new ArrayDataProvider(navData.slice(1), { keyAttributes: "path" });

            // Header
            // Application Name used in Branding Area
            this.appName = ko.observable("FLS Demo");
            // User Info used in Global Navigation area
            var self = this
            self.userLogin = ko.observable()

            // Initializing Auth0Lock
            self.lock = new Auth0Lock(
                config.clientId,
                config.domain
            )

            // Listening for the authenticated event
            self.lock.on("authenticated", function(authResult) {
                self.lock.hide()
                    // Use the token in authResult to getUserInfo() and save it if necessary
                self.lock.getUserInfo(authResult.accessToken, function(error, profile) {
                    self.userLogin(profile.email)
                    self.router.go({ path: 'dashboard' })
                        .then(function() {
                            this.navigated = true;
                        })
                    if (error) {
                        // Handle error
                        self.router.go({ path: 'login' })
                            .then(function() {
                                this.navigated = true;
                            })
                    }
                })
            })

            self.lock.checkSession({}, function(err, authResult) {
                // handle error or new tokens
                if (authResult) self.lock.getUserInfo(authResult.accessToken, function(error, profile) {
                    self.userLogin(profile.email)
                })
                if (err) {
                    self.router.go({ path: 'login' })
                        .then(function() {
                            this.navigated = true;
                        })
                }
            })

            self.userLogin.subscribe(newValue => {
                this.disabledMenu(false)
            })


            this.logout = () => {
                self.userLogin("")
                this.disabledMenu(true)
                self.lock.logout()
            }

            //Get JWT Token
            this.apiToken = ko.observable()

            this.authToJWT = function() {
                return new Promise((resolve, reject) => {
                    var myHeaders = new Headers()
                    myHeaders.append("Content-Type", "application/json")

                    var raw = JSON.stringify({ "client_id": config.apiClientId, "client_secret": config.apiClientSecret, "audience": config.apiAudience, "grant_type": config.apiGrantType })

                    var requestOptions = {
                        method: 'POST',
                        headers: myHeaders,
                        body: raw
                    }

                    fetch(config.apiTokenURL + "/oauth/token", requestOptions)
                        .then(response => response.text())
                        .then(result => {
                            let token = JSON.parse(result)
                            resolve("Bearer " + token.access_token)
                        })
                        .catch(error => reject(error))
                })
            }

            //Region selection
            this.selectedRegion = ko.observable("eu-frankfurt-1");
            this.regionList = [
                { value: "eu-frankfurt-1", label: "Germany Central (Frankfurt)" },
                { value: "jp-tokyo-1", label: "Japan East (Tokyo)" },
                { value: "uk-south-1", label: "UK South" }
            ];
            this.regions = new ArrayDataProvider(this.regionList, {
                keyAttributes: "value",
            })

            // Footer
            this.footerLinks = [
                { name: 'About Oracle', linkId: 'aboutOracle', linkTarget: 'http://www.oracle.com/us/corporate/index.html#menu-about' },
                { name: "Contact Us", id: "contactUs", linkTarget: "http://www.oracle.com/us/corporate/contact/index.html" },
                { name: "Legal Notices", id: "legalNotices", linkTarget: "http://www.oracle.com/us/legal/index.html" },
                { name: "Terms Of Use", id: "termsOfUse", linkTarget: "http://www.oracle.com/us/legal/terms/index.html" },
                { name: "Your Privacy Rights", id: "yourPrivacyRights", linkTarget: "http://www.oracle.com/us/legal/privacy/index.html" },
            ];

        }

        // release the application bootstrap busy state
        Context.getPageContext().getBusyContext().applicationBootstrapComplete();

        return new ControllerViewModel();
    }
);