sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox"
], function (Controller, MessageBox) {
    "use strict";

    return Controller.extend("enviarfacturaextfront.controller.MainView", {
       onInit: function () {
            const oView = this.getView();
            const today = new Date();
            const lastMonth = new Date();
            lastMonth.setMonth(today.getMonth() - 1);

            const oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" });

            oView.byId("dpFechaDesde").setValue(oDateFormat.format(lastMonth));
            oView.byId("dpFechaHasta").setValue(oDateFormat.format(today));
        },

        onEnviarFactura: function () {
            this._validarSeleccion(() => {
                this.byId("dlgFacturaExterna").open();
            });
        },

        onEnviarAclaracion: function () {
            this._validarSeleccion(() => {
                this.byId("dlgAclaracion").open();
            });
        },

        onCerrarAclaracion: function () {
            this.byId("dlgAclaracion").close();
        },

        onEnviarAclaracionConfirm: function () {
            console.log("Aclaración enviada");
            this.byId("dlgAclaracion").close();
        },

        onCerrarDialog: function () {
            this.byId("dlgFacturaExterna").close();
        },

        _validarSeleccion: function (fnCallback) {
            const oTable = this.byId("cuentasTable");
            const aSelectedItems = oTable.getSelectedItems();

            if (aSelectedItems.length === 0) {
                MessageBox.information("Debe seleccionar al menos un registro para continuar.");
                return;
            }

            if (fnCallback) {
                fnCallback();
            }
        }
    });
});