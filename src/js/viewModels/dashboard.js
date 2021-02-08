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
define(['accUtils', "knockout", "ojs/ojarraydataprovider", 'ojs/ojjsontreedatasource', "ojs/ojasyncvalidator-regexp", "ojs/ojknockout", "ojs/ojtable", "ojs/ojcheckboxset", "ojs/ojinputnumber", "ojs/ojinputtext", "ojs/ojdialog", "ojs/ojbutton", "ojs/ojformlayout", "ojs/ojselectsingle", "ojs/ojmessages", "ojs/ojvalidationgroup", "ojs/ojdialog", "ojs/ojdefer", 'ojs/ojrowexpander', 'ojs/ojpagingcontrol', 'ojs/ojpagingtabledatasource', 'ojs/ojflattenedtreetabledatasource'],
    function(accUtils, ko, ArrayDataProvider, JsonTreeDataSource, AsyncRegExpValidator) {
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

                //NodeJS API
                let baseUrl = "http://localhost:3000"

                //messages
                const isoTimeNow = new Date().toISOString();
                this.messageTimeout = ko.observable(5000)

                this.deletedId = ko.observable("");

                this.messagesDataproviderInfo = ko.observable()
                this.messagesDataproviderConfirmation = ko.observable()
                this.messagesDataproviderConfirmationDeletion = ko.observable()

                this.instanceAddInfo = ko.observable(false)
                this.instanceDeleteInfo = ko.observable(false)
                this.instanceAddConfirmation = ko.observable(false)
                    // end messages

                this.somethingChecked = ko.observable(false);
                this.disableAdd = ko.observable(false);
                this.currentInstance = ko.observable("default");

                this.newInstanceName = ko.observable("");
                this.newInstanceShape = ko.observable("");
                this.workingId = ko.observable("");

                //validator for instance name
                this.groupValid = ko.observable("invalidHidden");
                this.patternValue = ko.observable("");
                this.validators = [
                    new AsyncRegExpValidator({
                        pattern: "[a-zA-Z0-9_]{6,20}",
                        hint: "Enter between 6 and 20 letters or numbers and underscore.",
                        messageDetail: "Enter between 6 and 20 letters or numbers and underscore.",
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
                            console.log(id)
                        })
                        console.log('Done')
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
                            closeAffordance: "none"
                        }];
                        this.messagesDataproviderInfo(new ArrayDataProvider(this.messagesInfo));
                        this.instanceAddInfo(true)
                            //Call the API
                        createInstance(this.newInstanceName(), this.newInstanceShape())
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
                this.shapes = ko.observable()
                var requestOptionsShape = {
                    method: 'GET',
                    redirect: 'follow'
                };

                fetch(baseUrl + "/shapes", requestOptionsShape)
                    .then(resShape => resShape.text())
                    .then(resultShape => {
                        this.shapes(new ArrayDataProvider(JSON.parse(resultShape), {
                            keyAttributes: "shape"
                        }));
                    })
                    .catch(error => console.log('error', error));

                this.getItemText = (itemContext) => {
                    return `${itemContext.data.shape}`;
                };

                var options = [];

                //function to get all Instances
                const getInstances = () => {
                    var requestOptions = {
                        method: 'GET',
                        redirect: 'follow'
                    };

                    fetch(baseUrl + "/instances", requestOptions)
                        .then(response => response.text())
                        .then(result => {
                            this.dataprovider(new ArrayDataProvider(JSON.parse(result), {
                                keyAttributes: "id",
                                implicitSort: [{ attribute: "id", direction: "ascending" }],
                            }))

                        })
                        .catch(error => console.log('error', error));
                }

                //get Public IP of instance
                /*                 function connectVNC(id, state) {
                                    if (state === "RUNNING") {
                                        getPublicIP(id)
                                    } else return;
                                }
                 */
                this.openURL = function(data, event) {
                    const id = event.data.id
                    var requestOptions = {
                        method: 'GET',
                        redirect: 'follow'
                    };
                    fetch(baseUrl + "/publicip/" + id, requestOptions)
                        .then(response => response.text())
                        .then(result => {
                            let uri = encodeURIComponent(JSON.parse(result))
                            let url = new URL("http://" + uri)
                            window.open(url)
                        })
                        .catch(error => console.log('error', error));
                }


                //get data from endpoint
                this.dataprovider = ko.observable()
                getInstances()

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
                    if (event.data.lifecycleState === "RUNNING") stopImage(event.data.id)
                    else if (event.data.lifecycleState === "STOPPED") startImage(event.data.id)
                }

                function startImage(id) {
                    var requestOptions = {
                        method: 'GET',
                        redirect: 'follow'
                    };

                    setTimeout(() => {
                        getInstances()
                    }, 2000);

                    fetch(baseUrl + "/start/" + id, requestOptions)
                        .then(response => response.text())
                        .then(result => {
                            getInstances()
                        })
                        .catch(error => console.log('error', error));
                }

                function stopImage(id) {
                    var requestOptions = {
                        method: 'GET',
                        redirect: 'follow'
                    };

                    setTimeout(() => {
                        getInstances()
                    }, 2000);

                    fetch(baseUrl + "/stop/" + id, requestOptions)
                        .then(response => { response.text() })
                        .then(result => {
                            getInstances()
                        })
                        .catch(error => console.log('error', error));
                }

                //function to create new Instance
                const createInstance = (name, shape) => {
                    var myHeaders = new Headers();
                    myHeaders.append("Content-Type", "application/json");

                    var raw = JSON.stringify({ "instanceName": name, "instanceShape": shape });

                    //reset the form fields
                    this.newInstanceName("")
                    this.newInstanceShape("")

                    //disable button
                    this.disableAdd(true)

                    var requestOptionsCreate = {
                        method: 'POST',
                        headers: myHeaders,
                        body: raw,
                        redirect: 'follow'
                    };

                    fetch(baseUrl + "/instances", requestOptionsCreate)
                        .then(response => response.text())
                        .then(result => {
                            this.messagesConfirmation = [{
                                severity: "confirmation",
                                summary: "The instance has been successfully provisioned.",
                                timestamp: isoTimeNow,
                                autoTimeout: parseInt(this.messageTimeout(), 10),
                                closeAffordance: "none"
                            }];
                            this.messagesDataproviderConfirmation(new ArrayDataProvider(this.messagesConfirmation))
                            this.instanceAddInfo(false)
                            this.instanceAddConfirmation(true)

                            //refresh the list
                            getInstances()
                                //enable button
                            this.disableAdd(false)
                        })
                        .catch(error => console.log('error', error));
                }

                const deleteInstance = id => {
                    new Promise(resolve => {
                        var myHeaders = new Headers();
                        myHeaders.append("Content-Type", "application/json");

                        var requestOptions = {
                            method: 'DELETE',
                            headers: myHeaders,
                            redirect: 'follow'
                        };

                        this.messagesConfirmationDeletion = [];
                        this.messagesDataproviderConfirmationDeletion(new ArrayDataProvider(this.messagesConfirmationDeletion))

                        fetch(baseUrl + "/instances/" + id, requestOptions)
                            .then(response => response.text())
                            .then(result => {
                                this.messagesConfirmationDeletion.push({
                                    severity: "confirmation",
                                    summary: "The instance with id " + id + " has been successfully deleted.",
                                    timestamp: isoTimeNow,
                                    autoTimeout: parseInt(this.messageTimeout(), 10),
                                    closeAffordance: "none"
                                })
                                this.instanceDeleteInfo(true)
                                getInstances()
                                resolve("Instance deleted")
                            })
                            .catch(error => console.log('error', error));
                    })
                }

                //modal controls
                this.close = function() {
                    document.getElementById("modalDialog1").close();
                }
                this.open = function() {
                    document.getElementById("modalDialog1").open();
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