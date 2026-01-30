sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "aclaracionesfront/model/formatter"
], (Controller, JSONModel, Filter, FilterOperator, MessageToast, formatter) => {
    "use strict";


    return Controller.extend("aclaracionesfront.controller.MainView", {
        onInit: function () {
            const oModel = new sap.ui.model.json.JSONModel();
            this.getView().setModel(oModel, "obtenAcla");
            this.getBusinessPartner();
            this.getAclaraciones();
        },

        getBusinessPartner: function () {
            const url = "/odata/v4/invitacion/ReadSupplier";
            console.log("[getBusinessPartner] URL:", url);

            fetch(url, { method: "GET", headers: { "Accept": "application/json" }, credentials: "include" })
                .then(res => {
                    console.log("[getBusinessPartner] Respuesta:", res.status, res.statusText);
                    return res.ok ? res.json() : res.text().then(t => { throw new Error(t); });
                })
                .then(data => {
                    console.log("[getBusinessPartner] Datos crudos:", data);
                    const aContactos = (data.value || []).map(bp => ({
                        UserID: bp.BusinessPartner,
                        UserNombre: bp.SupplierName,
                    }));
                    console.table(aContactos);
                    this.getView().getModel().setProperty("/UsrsDatos", aContactos);
                })
                .catch(err => console.error("[getBusinessPartner] Error:", err));
        },

        getAclaraciones: function () {
            const url = "/odata/v4/aclaraciones/Aclaraciones";
            fetch(url, { method: "GET", headers: { "Accept": "application/json" }, credentials: "include" })
                .then(res => res.ok ? res.json() : res.text().then(t => { throw new Error(t); }))
                .then(data => {
                    console.log("[getAclaraciones] Datos crudos:", data);
                    this.getView().getModel("obtenAcla").setData({ results: data.value || [] });
                })
                .catch(err => console.error("[getAclaraciones] Error:", err));
        },

        filtrado: function (oEvent) {
            const sQuery = oEvent.getParameter("newValue");
            const sKey = this.byId("selectFilter").getSelectedKey();

            const oTable = this.byId("idTableAcla");
            const oBinding = oTable.getBinding("items");

            let aFilters = [];
            if (sQuery && sKey) {
                aFilters.push(new sap.ui.model.Filter(sKey, sap.ui.model.FilterOperator.Contains, sQuery));
            }

            oBinding.filter(aFilters);
        }

    });
});