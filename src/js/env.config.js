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
define(['knockout'],
    function(ko) {

        function ConfigViewModel() {

            //App-wide variables go here

            //API URL
            this.loginURL = "http://localhost:3000"
            this.apiURL = this.loginURL + "/oci"

            //Auth0 Config
            this.clientId = 'jTYymBAspIRRP55D9pRCsovEToivoWJp'
            this.domain = 'dev-bbijppeg.eu.auth0.com'

            //JWT Token config
            this.apiTokenURL = "https://dev-bbijppeg.eu.auth0.com"
            this.apiClientId = "RzZGTLuU3iS1yxBOd9qBWNiVfiCYwL8n"
            this.apiClientSecret = "sBRoQzSdSKZjvvBtFNBd-nczIcUDOGHCXVg-vT7GsJ8UeElSleyy5pEyGpSu1QOa"
                //this.apiClientId = "lVlSqK9oX1Ugdk49qMtgFYbbBK5Vsr6I" //SSL
                //this.apiClientSecret = "xS-qz3syem6XbiUDHoDrhsQFt7sRZNdCD2_tuW99COSc6RSABoCrAPZKgcgq4d9i" //SSL
            this.apiAudience = this.loginURL
            this.apiGrantType = "client_credentials"

        }

        return new ConfigViewModel()

    })