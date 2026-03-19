// Test file for Google Calendar integration (Browser-compatible version)
// This file contains example usage and test cases

import {
  GoogleCalendarService,
  initGoogleAuth,
  isGoogleCalendarConnected,
  loadGoogleIdentityServices,
  createMaintenanceEvent,
  createShowingEvent,
  createLeaseRenewalReminder,
  getUpcomingEvents,
  deleteEvent,
  MaintenanceEventDetails,
  ShowingEventDetails,
  LeaseRenewalDetails,
} from './googleCalendar';

console.log('🧪 Google Calendar Integration Tests\n');

// Test data examples
const exampleMaintenanceEvent: MaintenanceEventDetails = {
  summary: 'Test: Fix Leaky Faucet',
  description: 'Tenant reported dripping faucet in kitchen sink',
  location: '123 Main St, Unit 4B',
  startDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
  endDateTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
  tenantName: 'John Doe',
  unitNumber: '4B',
  issue: 'Leaky kitchen faucet',
  priority: 'medium',
};

const exampleShowingEvent: ShowingEventDetails = {
  summary: 'Test: Property Showing',
  description: 'Prospective tenant viewing',
  location: '123 Main St, Unit 2A',
  startDateTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
  endDateTime: new Date(Date.now() + 48.5 * 60 * 60 * 1000).toISOString(),
  prospectName: 'Jane Smith',
  prospectPhone: '555-0123',
  prospectEmail: 'jane@example.com',
  unitNumber: '2A',
  notes: 'Interested in 1-year lease',
};

const exampleRenewalReminder: LeaseRenewalDetails = {
  summary: 'Test: Lease Renewal Reminder',
  description: '60-day reminder for lease renewal',
  location: '123 Main St',
  tenantName: 'Bob Johnson',
  unitNumber: '3C',
  leaseEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
  reminderDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
};

// Export test functions for manual testing
export async function runGoogleCalendarTests() {
  console.log('🚀 Running Google Calendar Tests...\n');

  // Test 1: Load Google Identity Services
  console.log('Test 1: Load Google Identity Services');
  const loaded = await loadGoogleIdentityServices();
  console.log(`Result: ${loaded ? '✅ Loaded' : '❌ Failed to load'}`);

  // Test 2: Check connection status
  console.log('\nTest 2: Check Connection Status');
  const connected = isGoogleCalendarConnected();
  console.log(`Status: ${connected ? '✅ Connected' : '❌ Not connected'}`);

  if (!connected) {
    console.log('\n⚠️  Not connected. Please authenticate first by calling:');
    console.log('   const token = await GoogleCalendarService.signIn();');
    return;
  }

  // Test 3: Create maintenance event
  console.log('\nTest 3: Create Maintenance Event');
  const maintenanceEvent = await createMaintenanceEvent(exampleMaintenanceEvent);
  console.log('Result:', maintenanceEvent ? '✅ Success' : '❌ Failed');
  if (maintenanceEvent) {
    console.log('Event ID:', maintenanceEvent.id);
    console.log('Event Link:', maintenanceEvent.htmlLink);
  }

  // Test 4: Create showing event
  console.log('\nTest 4: Create Showing Event');
  const showingEvent = await createShowingEvent(exampleShowingEvent);
  console.log('Result:', showingEvent ? '✅ Success' : '❌ Failed');
  if (showingEvent) {
    console.log('Event ID:', showingEvent.id);
  }

  // Test 5: Create renewal reminder
  console.log('\nTest 5: Create Renewal Reminder');
  const renewalReminder = await createLeaseRenewalReminder(exampleRenewalReminder);
  console.log('Result:', renewalReminder ? '✅ Success' : '❌ Failed');
  if (renewalReminder) {
    console.log('Event ID:', renewalReminder.id);
  }

  // Test 6: Get upcoming events
  console.log('\nTest 6: Get Upcoming Events');
  const events = await getUpcomingEvents('primary', 10, 30);
  console.log(`Found ${events.length} events`);
  events.slice(0, 3).forEach((event, i) => {
    console.log(`  ${i + 1}. ${event.summary} (${event.start.dateTime || event.start.date})`);
  });

  // Test 7: Cleanup - Delete test events
  console.log('\nTest 7: Cleanup - Delete Test Events');
  if (maintenanceEvent?.id) {
    const deleted = await deleteEvent(maintenanceEvent.id);
    console.log(`Maintenance event deleted: ${deleted ? '✅' : '❌'}`);
  }
  if (showingEvent?.id) {
    const deleted = await deleteEvent(showingEvent.id);
    console.log(`Showing event deleted: ${deleted ? '✅' : '❌'}`);
  }
  if (renewalReminder?.id) {
    const deleted = await deleteEvent(renewalReminder.id);
    console.log(`Renewal reminder deleted: ${deleted ? '✅' : '❌'}`);
  }

  console.log('\n✅ All tests completed!');
}

// Manual test runner
export function printTestInstructions() {
  console.log(`
📋 Google Calendar Integration Test Instructions

1. Ensure you have set up environment variables:
   - VITE_GOOGLE_CLIENT_ID=your_client_id

2. In your browser console, run:
   import { runGoogleCalendarTests } from './src/services/googleCalendar.test.ts';
   await runGoogleCalendarTests();

3. Or use the service directly:
   import { GoogleCalendarService } from './src/services/googleCalendar';
   
   // Load the script
   await GoogleCalendarService.loadScript();
   
   // Sign in
   const token = await GoogleCalendarService.signIn();
   
   // Create an event
   const event = await GoogleCalendarService.createMaintenanceEvent({
     summary: 'Fix Leak',
     description: 'Kitchen faucet leaking',
     location: '123 Main St',
     startDateTime: '2024-12-25T10:00:00',
     endDateTime: '2024-12-25T11:00:00',
     tenantName: 'John Doe',
     unitNumber: '4B',
     issue: 'Leaky faucet',
     priority: 'medium',
   });

Example Event Data:
Maintenance: ${JSON.stringify(exampleMaintenanceEvent, null, 2)}
Showing: ${JSON.stringify(exampleShowingEvent, null, 2)}
Renewal: ${JSON.stringify(exampleRenewalReminder, null, 2)}
`);
}

// Print instructions when file is loaded
printTestInstructions();
