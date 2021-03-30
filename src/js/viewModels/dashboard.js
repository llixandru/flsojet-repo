/**
 * @license
 * Copyright (c) 2014, 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
/*
 * Your dashboard ViewModel code goes here
 */
define(['accUtils', "knockout", "appController", "ojs/ojanimation", "ojs/ojarraydataprovider", "ojs/ojasyncvalidator-regexp", '../env.config', "ojs/ojknockout", "ojs/ojtable", "ojs/ojcheckboxset", "ojs/ojinputnumber", "ojs/ojinputtext", "ojs/ojdialog", "ojs/ojbutton", "ojs/ojformlayout", "ojs/ojselectsingle", "ojs/ojmessages", "ojs/ojvalidationgroup", "ojs/ojdialog", "ojs/ojdefer", "ojs/ojpopup"],
    function(accUtils, ko, app, AnimationUtils, ArrayDataProvider, AsyncRegExpValidator, config) {
        function DashboardViewModel() {
            // Below are a set of the ViewModel methods invoked by the oj-module component.
            // Please reference the oj-module jsDoc for additional information.

            /**
             * Optional ViewModel method invoked after the View is inserted into the
             * document DOM.  The application can put logic that requires the DOM being
             * attached here.
             * This method might be called multiple times - after the View is created
             * and inserted into the DOM and after the View is reconnected
             * after being disconnected.
             */
            this.connected = () => {
                accUtils.announce('Dashboard page loaded.');
                document.title = "Dashboard";
                // Implement further logic if needed
                let self = this
                    //NodeJS API
                let baseUrl = config.apiURL

                //messages
                const isoTimeNow = new Date().toISOString();
                this.messageTimeout = ko.observable(10000)

                this.deletedId = ko.observable("");

                this.messagesDataproviderInfo = ko.observable()
                this.messagesDataproviderConfirmation = ko.observable()
                this.messagesDataproviderConfirmationDeletion = ko.observable()
                this.messagesDataproviderError = ko.observable()

                this.instanceAddInfo = ko.observable(false)
                this.instanceDeleteInfo = ko.observable(false)
                this.instanceAddConfirmation = ko.observable(false)
                this.instanceError = ko.observable(false)
                    // end messages

                this.somethingChecked = ko.observable(false);
                this.disableAdd = ko.observable(false);
                this.currentInstance = ko.observable("default");

                this.newInstanceName = ko.observable("");
                this.newInstanceShape = ko.observable("");
                this.workingId = ko.observable("");

                this.vncPass = ko.observable("");
                this.createdInstance = ko.observable("");
                this.allowedNumberLeft = ko.observable();
                this.checkNumber = ko.observable("text-normal")

                self.instanceOwner = ko.observable(app.userLogin())

                app.userLogin.subscribe(newValue => {
                    self.instanceOwner(newValue)
                })

                app.selectedRegion.subscribe(newRegion => {
                    getInstances()
                    getShapes()
                })

                //validator for instance name
                this.groupValid = ko.observable("invalidHidden");
                this.patternValue = ko.observable("");
                this.validators = [
                    new AsyncRegExpValidator({
                        pattern: "[a-zA-Z0-9_-]{6,20}",
                        hint: "Enter between 6 and 20 letters or numbers, dash and underscore.",
                        messageDetail: "Enter between 6 and 20 letters or numbers, dash and underscore.",
                        autoTimeout: parseInt(this.messageTimeout(), 10)
                    }),
                ];

                //OCID display
                this.showOCID = (id, style) => {
                    if (!style) {
                        const n = 6;
                        return "..." + id.substring(id.length - n);
                    } else if (style === "full") {
                        return id
                    }
                }

                this.showMore = (data, event) => {
                    let id = event.target.id;
                    var dots = document.getElementById(id);
                    this.showOCID(id.substring(4), "full")
                        /* var moreText = document.getElementById("more" + id.substring(4));

                        if (dots.style.display === "none") {
                            dots.style.display = "inline";
                            moreText.style.display = "none";
                        } else {
                            dots.style.display = "none";
                            moreText.style.display = "inline";
                        } */
                }

                this.findInstanceId = () => {
                    let selectedIdsArray = [];
                    const divs = document.getElementsByTagName("oj-checkboxset");
                    for (let i = 0; i < divs.length; i++) {
                        const cbComp = divs[i];
                        if (cbComp.value && cbComp.value.length) {
                            selectedIdsArray.push(cbComp.value[0]);
                        }
                    }
                    return selectedIdsArray;
                };

                this.enableDelete = (event) => {
                    this.somethingChecked(event && event.detail && event.detail.value && event.detail.value.length);
                };

                this.removeInstance = (event, data) => {
                    let instanceIds = [];
                    instanceIds = this.findInstanceId();

                    //disable button
                    this.somethingChecked(false)

                    //terminate all selected instance
                    async function asyncForEach(array, callback) {
                        for (let index = 0; index < array.length; index++) {
                            await callback(array[index], index, array);
                        }
                    }

                    const start = async() => {
                        await asyncForEach(instanceIds, async(id) => {
                            await deleteInstance(id)
                        })
                    }
                    start()

                }

                this.addInstance = (event) => {
                    let valid = this._checkValidationGroup();
                    if (valid) {
                        // submit the form would go here
                        this.messagesInfo = [{
                            severity: "info",
                            summary: "The instance is being provisioned, please wait.",
                            timestamp: isoTimeNow,
                            closeAffordance: "none",
                            autoTimeout: parseInt(this.messageTimeout(), 10)
                        }];
                        this.messagesDataproviderInfo(new ArrayDataProvider(this.messagesInfo));
                        this.instanceAddInfo(true)
                            //Call the API
                        createInstance(this.newInstanceName(), this.newInstanceShape(), self.instanceOwner())
                            //disable button
                        self.disableAdd(true)
                    }
                };

                this._checkValidationGroup = () => {
                    var tracker = document.getElementById("tracker");
                    if (tracker.valid === "valid") {
                        return true;
                    } else {
                        // show messages on all the components
                        // that have messages hidden.
                        tracker.showMessages();
                        tracker.focusOn("@firstInvalidShown");
                        return false;
                    }
                };

                //get Shapes for select
                this.selectVal = ko.observable()
                self.shapes = ko.observable()

                async function getShapes() {
                    let token = await app.authToJWT()
                    var myHeaders = new Headers();
                    myHeaders.append("Content-Type", "application/json")
                    myHeaders.append("Authorization", token)

                    var raw = JSON.stringify({ "region": app.selectedRegion() })

                    var requestOptionsShape = {
                        method: 'POST',
                        headers: myHeaders,
                        body: raw
                    };

                    fetch(baseUrl + "/shapes", requestOptionsShape)
                        .then(response => {
                            if (!response.ok) {
                                return response.text().then(text => { throw text })
                            }
                            return response.text();
                        })
                        .then(resultShape => {
                            self.shapes(new ArrayDataProvider(JSON.parse(resultShape), {
                                keyAttributes: "shape"
                            }));
                        })
                        .catch(error => {
                            onRejected(error)
                        });
                }

                getShapes()

                this.getItemText = (itemContext) => {
                    return `${itemContext.data.shape}`
                };

                var options = [];

                //function to get all Instances
                async function getInstances() {
                    let token = await app.authToJWT()
                    var myHeaders = new Headers()
                    myHeaders.append("Content-Type", "application/json")
                    myHeaders.append("Authorization", token)

                    var raw = JSON.stringify({ "region": app.selectedRegion(), "instanceOwner": self.instanceOwner() })

                    var requestOptions = {
                        method: 'POST',
                        headers: myHeaders,
                        body: raw,
                        redirect: 'follow'
                    }

                    fetch(baseUrl + "/getinstances", requestOptions)
                        .then(response => {
                            if (!response.ok) {
                                return response.text().then(text => { throw text })
                            }
                            return response.text();
                        })
                        .then(result => {
                            let res = JSON.parse(result)
                            self.allowedNumberLeft(res.allowedNumberLeft)
                                //disable button check
                            if (self.allowedNumberLeft() === 0) self.disableAdd(true)
                            self.allowedNumberLeft() === 0 ? self.checkNumber("text-red") : self.checkNumber("text-green")
                            self.dataprovider(new ArrayDataProvider(res.listInstances, {
                                keyAttributes: "id",
                                implicitSort: [{ attribute: "id", direction: "ascending" }],
                            }))

                        })
                        .catch(error => {
                            //console.log('error', error)
                            onRejected(error)
                        });
                }

                this.openURL = function(data, event) {
                    const id = event.data.id
                    getIPAddress(id)
                }

                async function getIPAddress(id) {
                    var myHeaders = new Headers()
                    let token = await app.authToJWT()
                    myHeaders.append("Content-Type", "application/json")
                    myHeaders.append("Authorization", token)

                    var raw = JSON.stringify({ "region": app.selectedRegion(), "instanceId": id })

                    var requestOptions = {
                        method: 'POST',
                        headers: myHeaders,
                        body: raw
                    };

                    fetch(baseUrl + "/publicip", requestOptions)
                        .then(response => {
                            if (!response.ok) {
                                return response.text().then(text => { throw text })
                            }
                            return response.text();
                        })
                        .then(result => {
                            let uri = encodeURIComponent(JSON.parse(result))
                                //let url = new URL("http://" + uri)
                            let url = new URL("https://" + uri + "/vnc.html?host=" + uri + "&port=443&resize=remote")
                            window.open(url)
                        })
                        .catch(error => {
                            //console.log('error', error)
                            onRejected(error)
                        });
                }


                //get data from endpoint
                this.dataprovider = ko.observable()

                if (self.instanceOwner()) getInstances()
                else
                    app.userLogin.subscribe(newValue => {
                        getInstances()
                    })

                this.checkConnection = function(state) {
                    if (state === "RUNNING") return false
                    else return true
                }

                this.startStopButtons = function(state) {
                        if (state === "RUNNING") return true
                        else if (state === "STOPPED") return true
                        else return false
                    }
                    //check instance status
                this.checkInstanceStatus = function(state) {
                        if (state === "RUNNING") {
                            return 'Stop'
                        } else if (state === "STOPPED") {
                            return 'Start'
                        }
                    }
                    //set icon depending on the instance status
                this.setStatusIcon = function(state) {
                    if (state === "RUNNING") {
                        return 'oj-ux-ico-pause'
                    } else if (state === "STOPPED") {
                        return 'oj-ux-ico-play'
                    }
                }

                this.startStopImage = function(data, event) {
                    if (event.data.lifecycleState == "RUNNING") stopImage(event.data.id)
                    else if (event.data.lifecycleState == "STOPPED") startImage(event.data.id)
                }

                async function startImage(id) {

                    var myHeaders = new Headers()
                    let token = await app.authToJWT()
                    myHeaders.append("Content-Type", "application/json")
                    myHeaders.append("Authorization", token)

                    var raw = JSON.stringify({ "region": app.selectedRegion(), "instanceId": id })

                    var requestOptions = {
                        method: 'POST',
                        headers: myHeaders,
                        body: raw
                    };

                    setTimeout(() => {
                        getInstances()
                    }, 2000);

                    fetch(baseUrl + "/start", requestOptions)
                        .then(response => {
                            if (!response.ok) {
                                return response.text().then(text => { throw text })
                            }
                            return response.text();
                        })
                        .then(result => {
                            getInstances()
                        })
                        .catch(error => {
                            //console.log('error', error)
                            onRejected(error)
                        });
                }

                async function stopImage(id) {
                    var myHeaders = new Headers()
                    let token = await app.authToJWT()
                    myHeaders.append("Content-Type", "application/json")
                    myHeaders.append("Authorization", token)

                    var raw = JSON.stringify({ "region": app.selectedRegion(), "instanceId": id })

                    var requestOptions = {
                        method: 'POST',
                        headers: myHeaders,
                        body: raw
                    };

                    setTimeout(() => {
                        getInstances()
                    }, 2000);

                    fetch(baseUrl + "/stop", requestOptions)
                        .then(response => {
                            if (!response.ok) {
                                return response.text().then(text => { throw text })
                            }
                            return response.text();
                        })
                        .then(result => {
                            getInstances()
                        })
                        .catch(error => {
                            //console.log('error', error)
                            onRejected(error)
                        });
                }

                //function to create new Instance
                async function createInstance(name, shape, owner) {

                    self.close()

                    var myHeaders = new Headers();
                    let token = await app.authToJWT()
                    myHeaders.append("Content-Type", "application/json");
                    myHeaders.append("Authorization", token)

                    var raw = JSON.stringify({ "region": app.selectedRegion(), "instanceName": name, "instanceShape": shape, "instanceOwner": owner })

                    self.createdInstance(name)

                    //reset the form fields
                    self.newInstanceName("")
                    self.newInstanceShape("")

                    setTimeout(() => {
                        getInstances()
                    }, 2000);

                    var requestOptionsCreate = {
                        method: 'POST',
                        headers: myHeaders,
                        body: raw
                    }

                    fetch(baseUrl + "/instances", requestOptionsCreate)
                        .then(response => {
                            if (!response.ok) {
                                //enable button
                                //self.disableAdd(false)
                                //hide messages
                                self.instanceAddInfo(false)
                                self.instanceAddConfirmation(false)
                                return response.text().then(text => { throw text })
                            }
                            return response.text();
                        })
                        .then(result => {
                            //get the VNC password
                            let resp = JSON.parse(result)
                            self.vncPass(resp.password)

                            //create the confirmation message
                            self.messagesConfirmation = [{
                                severity: "confirmation",
                                summary: "The instance has been successfully provisioned.",
                                timestamp: isoTimeNow,
                                closeAffordance: "none",
                                autoTimeout: parseInt(self.messageTimeout(), 10)
                            }];
                            self.messagesDataproviderConfirmation(new ArrayDataProvider(self.messagesConfirmation))
                            self.instanceAddInfo(false)
                            self.instanceAddConfirmation(true)

                            //show the VNC password
                            self.openListener()

                            //refresh the list
                            getInstances()
                                //enable button
                            self.disableAdd(false)
                        })
                        .catch(error => {
                            console.log('error', error)
                                //onRejected(error)
                        });
                }

                async function deleteInstance(id) {
                    var myHeaders = new Headers();
                    let token = await app.authToJWT()
                    myHeaders.append("Content-Type", "application/json");
                    myHeaders.append("Authorization", token)

                    var raw = JSON.stringify({ "region": app.selectedRegion(), "instanceId": id })

                    var requestOptions = {
                        method: 'DELETE',
                        headers: myHeaders,
                        body: raw
                    };

                    self.messagesConfirmationDeletion = [];
                    self.messagesDataproviderConfirmationDeletion(new ArrayDataProvider(self.messagesConfirmationDeletion))

                    fetch(baseUrl + "/instances", requestOptions)
                        .then(response => {
                            if (!response.ok) {
                                return response.text().then(text => { throw text })
                            }
                            return response.text();
                        })
                        .then(result => {
                            self.messagesConfirmationDeletion.push({
                                severity: "confirmation",
                                summary: "The instance(s) have been successfully deleted.",
                                timestamp: isoTimeNow,
                                autoTimeout: parseInt(self.messageTimeout(), 10),
                                closeAffordance: "none"
                            })
                            self.instanceDeleteInfo(true)
                            self.disableAdd(false)
                            getInstances()
                        })
                        .catch(error => {
                            //console.log(error)
                            onRejected(error)
                        });
                }

                async function listRegions() {
                    var myHeaders = new Headers()
                    let token = await app.authToJWT()
                    myHeaders.append("Content-Type", "application/json")
                    myHeaders.append("Authorization", token)

                    var requestOptions = {
                        method: 'GET',
                        headers: myHeaders,
                        redirect: 'follow'
                    }

                    fetch(baseUrl + "/regions", requestOptions)
                        .then(response => response.text())
                        .then(result => {
                            let data = JSON.parse(result)
                            app.regions(new ArrayDataProvider(data.items, {
                                keyAttributes: "regionName"
                            }))
                        })
                        .catch(error => onRejected(error))
                }

                listRegions()

                //error handling
                const onRejected = err => {
                    let error = JSON.parse(err)
                    let message = error.error.serviceCode
                    if (error.error.serviceCode == "NotAuthorizedOrNotFound")
                        message = "No data found"
                    this.messagesError = [{
                        severity: "error",
                        summary: error.error.statusCode + ": " + message,
                        timestamp: isoTimeNow,
                        closeAffordance: "none",
                        autoTimeout: parseInt(this.messageTimeout(), 10)
                    }];
                    this.messagesDataproviderError(new ArrayDataProvider(this.messagesError));
                    this.instanceError(true)
                }

                //modal controls
                this.close = function() {
                    document.getElementById("modalDialog1").close();
                    //close the provisioning message
                    this.instanceAddConfirmation(false)
                }
                this.open = function() {
                    document.getElementById("modalDialog1").open();
                }

                //pop-up controls
                this.startAnimationListener = (event) => {
                    let ui = event.detail;
                    if (event.target.id !== "popup1") {
                        return;
                    }
                    if (ui.action === "open") {
                        event.preventDefault();
                        let options = { direction: "bottom" };
                        AnimationUtils.slideIn(ui.element, options).then(ui.endCallback);
                    } else if (ui.action === "close") {
                        event.preventDefault();
                        ui.endCallback();
                    }
                };
                this.openListener = function() {
                    let popup = document.getElementById("popup1");
                    popup.open();
                }
                this.cancelListener = function() {
                    let popup = document.getElementById("popup1");
                    popup.close();
                }

            };

            /**
             * Optional ViewModel method invoked after the View is disconnected from the DOM.
             */
            this.disconnected = () => {
                // Implement if needed
            };

            /**
             * Optional ViewModel method invoked after transition to the new View is complete.
             * That includes any possible animation between the old and the new View.
             */
            this.transitionCompleted = () => {
                // Implement if needed
            };
        }

        /*
         * Returns an instance of the ViewModel providing one instance of the ViewModel. If needed,
         * return a constructor for the ViewModel so that the ViewModel is constructed
         * each time the view is displayed.
         */
        return DashboardViewModel;
    }
);