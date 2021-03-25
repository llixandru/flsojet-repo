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

            //Endpoint API URL
            this.loginURL = "http://localhost:3000"
            this.apiURL = this.loginURL + "/oci"

            //Auth0 Config
            this.clientId = 'GPAwGSSAy00PrGwzzXED2vd3g6cceYGI'
            this.domain = 'liana.eu.auth0.com'

            //JWT Token config
            this.apiTokenURL = "https://liana.eu.auth0.com"
            this.apiClientId = "DGwCNOwo4lyvxMyYzF9lvcBxFXZNjx56"
            this.apiClientSecret = "E9nK6TB0iKj33Je4LqFxgxLgzkhaKge4xxwoTZnYiV49hjwNwR3Dkv2hIxsqyX4Q"
                //this.apiClientId = "lVlSqK9oX1Ugdk49qMtgFYbbBK5Vsr6I" //SSL
                //this.apiClientSecret = "xS-qz3syem6XbiUDHoDrhsQFt7sRZNdCD2_tuW99COSc6RSABoCrAPZKgcgq4d9i" //SSL
            this.apiAudience = this.loginURL
            this.apiGrantType = "client_credentials"

        }

        return new ConfigViewModel()

    })