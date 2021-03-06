/*jslint browser: true, nomen: true, unparam: true */
/*global App */

/*
* Copyright 2013, Junta de Andalucia
* http://www.juntadeandalucia.es/
*
* Authors:
*   Alberto Beiztegui <albertobeiz@gmail.com>
*   Alejandro Blanco <alejandro.b.e@gmail.com>
*
* All rights reserved - EUPL License V 1.1
* https://joinup.ec.europa.eu/software/page/eupl/licence-eupl
*/

App.module("OU.Models", function (Models, App, Backbone, Marionette, $, _) {
    "use strict";

    Models.OUModel = App.Policies.Models.GecosResourceModel.extend({
        resourceType: "ou",
        defaults: {
            type: "ou",
            source: "gecos",
            lock: false,
            extra: "",
            policyCollection: new App.Policies.Models.PolicyCollection(),
            master: "gecos",
            master_policies: {},
            isDomain: function () {
                return this.path.split(',').length === 2;
            },
            isEditable: undefined
        }
    });
});

App.module("OU.Views", function (Views, App, Backbone, Marionette, $, _) {
    "use strict";

    Views.OUForm = App.GecosFormItemView.extend({
        template: "#ou-template",
        tagName: "div",
        className: "col-sm-12",

        ui: {
            policies: "div#policies div.bootstrap-admin-panel-content"
        },
        events: {
            "click #submit": "saveForm",
            "click #delete": "deleteModel",
            "change input": "validate",
            "click button.refresh": "refresh"
        },

        policiesList: undefined,

        onBeforeRender: function () {
            var path = this.model.get("path");

            if (this.model.get("isEditable") !== undefined) { return; }

            if (path === "root") {
                this.model.set("isEditable", true);
            } else if (path.split(',').length === 2) {
                this.model.set("isEditable", this.model.get("master") === "gecos");
            } else {
                this.getDomainAttrs();
            }
        },

        onRender: function () {
            var oids = [],
                url;

            if (!_.isUndefined(this.model.id)) {
                this.$el.find("#name").attr('disabled', 'disabled');
            }
            this.policiesList = new App.Policies.Views.PoliciesList({
                el: this.ui.policies[0],
                collection: this.model.get("policyCollection"),
                resource: this.model
            });
            this.policiesList.render();

            if (!_.isEmpty(this.model.get("master_policies")) && this.model.get("path").split(',').length === 2) {
                _.each(this.model.get("master_policies"), function (o, k) {
                    oids.push(k);
                });
                oids = oids.join(",");
                url = "/api/policies/?oids=" + oids;

                $.ajax(url).done(function (response) {
                    var $masterPolicies = $("#master-policies dl"),
                        list;

                    list = response.policies.map(function (p) {
                        return p['name_' + App.language] || p.name;
                    });
                    list = list.join(", ");
                    $masterPolicies.append("<dd>" + list + "</dd>");
                });
            }

            if (!this.model.get("isEditable")) {
                this.$el.find("textarea, input").prop("disabled", true);
            }
        },

        saveForm: function (evt) {
            evt.preventDefault();
            this.saveModel($(evt.target), {
                name: "#name",
                extra: "#extra"
            });
        }
    });
});
