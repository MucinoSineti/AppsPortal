sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/ui/model/Sorter"
], (Controller, JSONModel, Filter, FilterOperator, Sorter) => {
  "use strict";

  const fnFormat = (d) => d.toISOString().split("T")[0];
  const daysBackDefault = 60;

  function subtractDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() - days);
    return d;
  }

  return Controller.extend("estadodecuentafront.controller.main", {
    onInit: function () {
      this.oODataJSONModel = new JSONModel();
      this.SearchF = "";
      this.SearchVal = "";
      this.FechaIni = null;
      this.FechaFin = null;

      this.oTotalesModel = new JSONModel({
        fechaHoy: "",
        saldo: 0,
        moneda: "MXN"
      });
      this.getView().setModel(this.oTotalesModel, "totales");

      this.getView().addEventDelegate({
        onBeforeShow: () => {
          const hoy = new Date();
          const desde = subtractDays(hoy, daysBackDefault);
          this.FechaIni = desde;
          this.FechaFin = hoy;
          this.getStatements(fnFormat(desde), fnFormat(hoy));
        }
      });
    },

    getStatements: function (sDateFrom, sDateTo) {
      let finalDate = sDateTo ? new Date(sDateTo) : new Date();
      let initDate = sDateFrom ? new Date(sDateFrom) : subtractDays(finalDate, daysBackDefault);

      const url = `/odata/v4/account-statement/AccountStatement?initDate=${fnFormat(initDate)}&finalDate=${fnFormat(finalDate)}`;
      console.log("URL llamada:", url);

      fetch(url, {
        method: "GET",
        headers: { "Accept": "application/json" },
        credentials: "include"
      })
        .then(r => r.ok ? r.json() : r.text().then(t => { throw new Error(`HTTP ${r.status} - ${t}`); }))
        .then(data => {
          console.log("Respuesta API facturas:", data);
          this.oODataJSONModel.setData({ facturas: data.value || [] });
          this.getOwnerComponent().setModel(this.oODataJSONModel, "facturas");

          const hoy = new Date();
          const fechaHoy = hoy.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });

          let saldo = 0;
          (data.value || []).forEach(f => {
            if (!f.IsCleared) {
              saldo += parseFloat(f.AmountInTransactionCurrency || 0);
            }
          });

          this.oTotalesModel.setData({
            fechaHoy,
            saldo,
            moneda: (data.value && data.value[0]?.DocumentCurrency) || "MXN"
          });

          const oTable = this.byId("cuentasTable");
          const oBinding = oTable.getBinding("items");
          if (oBinding) {
            const oSorter = new Sorter("IsCleared", false, function (oContext) {
              return {
                key: oContext.getProperty("IsCleared"),
                text: oContext.getProperty("IsCleared") ? "Pagadas" : "Pendientes"
              };
            });
            oBinding.sort(oSorter);
          }
        })
        .catch(error => console.error("Error:", error));
    },

    onDateRangeChange: function (oEvent) {
      const dFrom = oEvent.getSource().getDateValue();
      const dTo = oEvent.getSource().getSecondDateValue();
      if (!dFrom || !dTo) return;
      this.FechaIni = dFrom;
      this.FechaFin = dTo;
      this.getStatements(fnFormat(dFrom), fnFormat(dTo));
    },


    formatStatus: function (bCleared) {
      return bCleared ? "Pagada" : "Pendiente";
    },

    onDateRangeChange: function (oEvent) {
      const oDateRange = oEvent.getSource();
      const dFrom = oDateRange.getDateValue();
      const dTo = oDateRange.getSecondDateValue();

      if (!dFrom || !dTo) return;

      this.FechaIni = dFrom;
      this.FechaFin = dTo;

      const fnFormat = (d) => d.toISOString().split("T")[0];
      this.getStatements(fnFormat(dFrom), fnFormat(dTo));
    },

    formatStatusState: function (bCleared) {
      return bCleared ? "Success" : "Error";
    },

    formatTipoDocumento: function (tipo) {
      if (tipo === "ZP" || tipo === "KZ") return "PAGO";
      if (tipo === "RE") return "FACTURA";
      return tipo || "";
    },

    establecePeriodo: function () {
      if (!this.oCalendarPopover) {
        const oDateRange = new sap.m.DateRangeSelection("calendarPopup", {
          displayFormat: "yyyy-MM-dd",
          delimiter: " - "
        });

        const oButton = new sap.m.Button({
          text: "Consultar",
          type: "Emphasized",
          press: () => {
            const dFrom = oDateRange.getDateValue();
            const dTo = oDateRange.getSecondDateValue();
            const fnFormat = (d) => d.toISOString().split("T")[0];

            if (dFrom && dTo) {
              this.getStatements(fnFormat(dFrom), fnFormat(dTo));
            } else {
              const hoy = new Date();
              this.getStatements(null, fnFormat(hoy));
            }

            this.oCalendarPopover.close();
          }
        });

        this.oCalendarPopover = new sap.m.Popover({
          title: "Seleccione Período de Consulta",
          contentWidth: "300px",
          content: [oDateRange, oButton],
          placement: sap.m.PlacementType.Bottom,
          showHeader: true
        });
      }

      const oButton = this.byId("bConsultarEC");
      this.oCalendarPopover.openBy(oButton);
    },


    onSapNumberPress: function (oEvent) {
      const oContext = oEvent.getSource().getBindingContext("facturas");
      const oData = oContext.getObject();

      if (!this.oFacturaDialog) {
        this.oFacturaDialog = new sap.m.Dialog({
          title: "Facturas Relacionadas",
          contentWidth: "600px",
          contentHeight: "400px",
          resizable: true,
          draggable: true,
          content: [
            new sap.m.Table({
              columns: [
                new sap.m.Column({ header: new sap.m.Text({ text: "Num. de Factura" }) }),
                new sap.m.Column({ header: new sap.m.Text({ text: "UUID" }) }),
                new sap.m.Column({ header: new sap.m.Text({ text: "Referencia" }) }),
                new sap.m.Column({ header: new sap.m.Text({ text: "Fecha de Factura" }) }),
                new sap.m.Column({ header: new sap.m.Text({ text: "Importe" }) })
              ],
              items: {
                path: "facturas>/relatedInvoices",
                template: new sap.m.ColumnListItem({
                  cells: [
                    new sap.m.Text({ text: "{facturas>SupplierInvoice}" }),
                    new sap.m.Text({ text: "{facturas>JrnlEntryCntrySpecificRef1}" }),
                    new sap.m.Text({ text: "{facturas>Reference}" }),
                    new sap.m.Text({ text: "{facturas>DocumentDate}" }),
                    new sap.m.ObjectNumber({
                      number: "{facturas>AmountInTransactionCurrency}",
                      unit: "{facturas>DocumentCurrency}"
                    })
                  ]
                })
              }
            })
          ],
          endButton: new sap.m.Button({
            text: "Cerrar",
            press: () => this.oFacturaDialog.close()
          })
        });
        this.getView().addDependent(this.oFacturaDialog);
      }

      this.oFacturaDialog.open();
    }

  });
});