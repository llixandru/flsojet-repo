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
define(['knockout', 'ojs/ojcontext', 'ojs/ojmodule-element-utils', 'ojs/ojresponsiveutils', 'ojs/ojresponsiveknockoututils', 'ojs/ojcorerouter', 'ojs/ojmodulerouter-adapter', 'ojs/ojknockoutrouteradapter', 'ojs/ojurlparamadapter', 'ojs/ojarraydataprovider', 'ojs/ojknockouttemplateutils', 'ojs/ojmodule-element', 'ojs/ojknockout'],
    function(ko, Context, moduleUtils, ResponsiveUtils, ResponsiveKnockoutUtils, CoreRouter, ModuleRouterAdapter, KnockoutRouterAdapter, UrlParamAdapter, ArrayDataProvider, KnockoutTemplateUtils) {

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

            this.domain = "dev-68999355.okta.com"
            this.oktaSignIn = new OktaSignIn({
                baseUrl: "https://dev-68999355.okta.com",
                clientId: "0oa55av80khTm3IDS5d6",
                redirectUri: 'http://localhost:8000/?ojr=dashboard',
                postLogoutRedirectUri: 'http://localhost:8000/?ojr=login',
                authParams: {
                    issuer: "https://dev-68999355.okta.com/oauth2/default",
                    responseType: ['id_token', 'token'],
                    scopes: ['openid', 'email', 'profile']
                }
            });


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

            this.oktaSignIn.authClient.token.getUserInfo().then(function(user) {
                //route to dashboard and set user
                self.userLogin(user.email)
            }, error => {
                this.router.go({ path: 'login' })
                    .then(function() {
                        this.navigated = true;
                    })
            })

            this.userLogin.subscribe(newValue => {
                this.disabledMenu(false);
            })


            this.logout = () => {
                self.userLogin("")
                this.disabledMenu(true)
                this.oktaSignIn.authClient.tokenManager.clear()
                this.router.go({ path: 'login' })
                    .then(function() {
                        this.navigated = true;
                    })

            }

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