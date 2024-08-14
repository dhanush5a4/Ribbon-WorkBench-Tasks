
//1-Create a Button on Contact Main form that redirects to related Account
function redirectToAccount(primaryControl)
{
	var formContext = primaryControl;
	var accountLookup = formContext.getAttribute("parentcustomerid").getValue();
	if (accountLookup != null)
	{
		var accountId = accountLookup[0].id;
		var accountUrl = formContext.context.getClientUrl() + "/main.aspx?etn=account&pagetype=entityrecord&id=" + accountId;
		window.open(accountUrl, "_blank");
	}
	else
	{
		alert("No related account found.");
	}
}
//2-Create a Custom Button called Inactive on the Contact Main form (that should only display on existing form)
function inactiveRecord(primaryControl)
{
	var formContext = primaryControl;
	if (formContext.ui.getFormType() === 1)
	{
		alert("This button is only available on existing records.");
		return;
	}
	// Set the status of the Contact to 'Inactive'
	formContext.getAttribute("statecode").setValue(1); // 1 corresponds to 'Inactive'
	formContext.getAttribute("statuscode").setValue(2); // 2 corresponds to the specific 'Inactive' status reason
	formContext.data.entity.save(); // Save the form
	alert("Contact has been set to Inactive.");
}


//3-Create a split button on Contact main form that should focus on
 //Details tab & Address section on summary tab
function addressSection(primaryControl)
{
	debugger;
	var formContext = primaryControl;
	var tab = formContext.ui.tabs.get("SUMMARY_TAB");
	var currentForm = formContext.ui.formSelector.getCurrentItem();
	var section = tab.sections.get(SUMMARY_TAB_section_6)
	if (section)
	{
		//section.setFocus();
		var addressControl = formContext.getControl("address1_line1");
		if (addressControl)
		{
			addressControl.setFocus();
		}
		//section.setFocus();
	}
}

function detailsTab(primaryControl)
{
	var formContext = primaryControl;
	var tab = formContext.ui.tabs.get("DETAILS_TAB");
	var currentForm = formContext.ui.formSelector.getCurrentItem();
	if (tab)
	{
		tab.setFocus();
	}
}

function hideTabAndSection(primaryControl)
{
	var formContext = primaryControl;
	// Hide the tab
	var tab = formContext.ui.tabs.get("DETAILS_TAB");
	if (tab)
	{
		tab.setVisible(false);
	}
	else
	{
		alert("The Details tab could not be found.");
	}
	// Hide the section within the Summary tab
	var section = formContext.ui.tabs.get("SUMMARY_TAB").sections.get("SUMMARY_TAB_section_6");
	if (section)
	{
		section.setVisible(false);
	}
	else
	{
		alert("The Address section could not be found.");
	}
}

function showTabAndSection(primaryControl)
{
	var formContext = primaryControl;
	// Show the tab
	var tab = formContext.ui.tabs.get("DETAILS_TAB");
	if (tab)
	{
		tab.setVisible(true);
	}
	else
	{
		alert("The Details tab could not be found.");
	}
	// Show the section within the Summary tab
	var section = formContext.ui.tabs.get("SUMMARY_TAB").sections.get("SUMMARY_TAB_section_6");
	if (section)
	{
		section.setVisible(true);
	}
	else
	{
		alert("The Address section could not be found.");
	}
}


//Form Readonly
function makeFormReadOnly(primaryControl)
{
	var formContext = primaryControl;
	debugger;
	// Loop through all the attributes on the form
	formContext.data.entity.attributes.forEach(function (attribute)
	{
		var control = formContext.getControl(attribute.getName());
		if (control)
		{
			control.setDisabled(true); // Disable (make read-only) the control
		}
	});
	alert("The form is now read-only.");
}




//selected records -> on accnt entity ->if accnt deactivates->it's child also deactivates.
function deactivateAccountsAndContacts(selectedItems)
{
	if (selectedItems.length === 0)
	{
		Xrm.Utility.alertDialog("Please select at least one Account.");
		return;
	}
	// Loop through selected Account records
	selectedItems.forEach(function (item)
	{
		var accountId = item.Id.replace("{", "").replace("}", ""); // Remove curly braces
		// Deactivate the Account
		deactivateRecord("account", accountId);
		console.log(accountId)
		// Get related Contacts
		retrieveRelatedContacts(accountId).then(function (contacts)
		{
			contacts.forEach(function (contact)
			{
				deactivateRecord("contact", contact.contactid);
			});
		});
	});
	Xrm.Utility.alertDialog("Selected Accounts and related Contacts have been deactivated.");
}
// Function to deactivate a record

function deactivateRecord(entityName, id)
{
	var entity = {};
	entity.statecode = 1; // 1 corresponds to 'Inactive'
	entity.statuscode = 2;
	Xrm.WebApi.updateRecord(entityName, id, entity).then(

	function success(result)
	{
		alert("Record deactivated: " + id);
	},

	function (error)
	{
		Xrm.Utility.alertDialog("Error deactivating record: " + id + "\n" + error.message);
	});
}
// Function to retrieve related Contacts

function retrieveRelatedContacts(accountId)
{
	var query = "?$select=contactid&$filter=_parentcustomerid_value eq '" + accountId + "'";
	return Xrm.WebApi.retrieveMultipleRecords("contact", query).then(

	function success(result)
	{
		return result.entities;
	},

	function (error)
	{
		Xrm.Utility.alertDialog("Error retrieving related Contacts: " + error.message);
		return [];
	});
}


//Place a button on parent form on click of that button should open new child form and set values from parent to child form
function createChild(primaryControl)
{
	var formContext = primaryControl;
	var accntGuid = formContext.data.entity.getId().slice(1, -1);
	Xrm.WebApi.retrieveRecord("account", accntGuid, "?$select=accountid,name,emailaddress1,telephone1").then(

	function success(result)
	{
		console.log(result);
		// Columns
		var accountid = result["accountid"]; // Guid
		var name = result["name"]; // Text
		var emailaddress1 = result["emailaddress1"]; // Text
		var telephone1 = result["telephone1"]; // Text
		//create Contact record
		var record = {};
		record.lastname = name; // Text
		record.telephone1 = telephone1; // Text
		record.emailaddress1 = emailaddress1; // Text
		record["parentcustomerid_account@odata.bind"] = "/accounts(" + accountid + ")"; // Customer
		Xrm.WebApi.createRecord("contact", record).then(

		function success(result)
		{
			var newId = result.id;
			Xrm.Utility.openEntityForm("contact", newId);
			console.log(newId);
		},

		function (error)
		{
			console.log(error.message);
		});
	},

	function (error)
	{
		console.log(error.message);
	});
}
//Create a button on subgrid that should Deactivate the record

function subgridDeleteRecord(selectedItems)
{
	if (selectedItems.length === 0)
	{
		Xrm.Utility.alertDialog("Please select at least one Record.");
		return;
	}
	// Loop through selected Account records
	selectedItems.forEach(function (item)
	{
		var cnctId = item.Id.replace("{", "").replace("}", ""); // Remove curly braces
		// Deactivate the Account
		deactivateRecord("account", cnctId);
		console.log(cnctId)
	});
	Xrm.Utility.alertDialog("Selected records have been deactivated.");
}



//Based on view show button(Unbill , Bill account ) on subgrid (this code is not working)
function subgridView(selectedControl) {
    debugger;
    var viewName = selectedControl._controlName;
    return (viewName === "Account Associated View" || viewName === "Inactive Accounts");
}
