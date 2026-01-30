sap.ui.define([], function() {
  "use strict";
  return {
    formatDate: function(value) {
      if (!value) {
        return "";
      }
      const date = (value instanceof Date) ? value : new Date(value);
      return date.toISOString().split("T")[0];
    }
  };
});