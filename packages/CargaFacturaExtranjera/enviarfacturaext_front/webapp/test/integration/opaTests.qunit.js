/* global QUnit */
QUnit.config.autostart = false;

sap.ui.require(["enviarfacturaextfront/test/integration/AllJourneys"
], function () {
	QUnit.start();
});
