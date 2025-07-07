
import React, { useState, useEffect } from 'react';
import { UserAlertPreference, ScheduledReportSubscription, NotificationChannel, AlertSeverity, ReportDefinition } from '@/types';
import { alertingService } from '@/services/alertingService'; // To save preferences
import { REPORT_DEFINITIONS, NOTIFICATION_TYPES as ALERT_TYPES_CONSTANT } from '@/constants'; // For report names and alert types

interface NotificationPreferencesFormProps {
  // Props if needed, e.g., userId
}

const TAILWIND_CHECKBOX_CLASSES = "h-4 w-4 text-primary-600 border-secondary-300 dark:border-secondary-500 rounded focus:ring-primary-500";
const TAILWIND_LABEL_CLASSES = "ml-2 block text-sm text-secondary-700 dark:text-secondary-300";
const TAILWIND_SECTION_CLASSES = "p-4 bg-white dark:bg-secondary-800 shadow rounded-lg";

const NotificationPreferencesForm: React.FC<NotificationPreferencesFormProps> = () => {
  const [alertPreferences, setAlertPreferences] = useState<UserAlertPreference[]>([]);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReportSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Available alert types and channels (could be dynamic in a real app)
  const availableAlertTypes = Object.values(ALERT_TYPES_CONSTANT); // Use defined alert types
  const availableChannels = Object.values(NotificationChannel);
  const availableFrequencies: ScheduledReportSubscription['frequency'][] = ['Daily', 'Weekly', 'Monthly'];

  useEffect(() => {
    const loadPreferences = async () => {
      setIsLoading(true);
      try {
        const [alerts, reports] = await Promise.all([
          alertingService.getUserAlertPreferences(),
          alertingService.getScheduledReportSubscriptions()
        ]);
        setAlertPreferences(alerts);
        setScheduledReports(reports.map(r => ({...r, reportName: REPORT_DEFINITIONS.find(def => def.id === r.reportId)?.name || r.reportId })));
      } catch (error) {
        console.error("Failed to load notification preferences:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPreferences();
  }, []);

  const handleAlertPreferenceChange = (alertType: string, channel: NotificationChannel, checked: boolean) => {
    setAlertPreferences(prev =>
      prev.map(pref => {
        if (pref.alertType === alertType) {
          const newChannels = checked
            ? [...pref.channels, channel]
            : pref.channels.filter(c => c !== channel);
          return { ...pref, channels: newChannels };
        }
        return pref;
      })
    );
  };

  const handleAlertEnableChange = (alertType: string, enabled: boolean) => {
     setAlertPreferences(prev =>
      prev.map(pref =>
        pref.alertType === alertType ? { ...pref, enabled } : pref
      )
    );
  };
  
  const handleScheduledReportChange = (reportId: string, field: keyof ScheduledReportSubscription, value: any) => {
    setScheduledReports(prev =>
      prev.map(sub => {
        if (sub.reportId === reportId) {
          if (field === 'channels') { // Special handling for channels array
            const channel = value as NotificationChannel;
            const newChannels = sub.channels.includes(channel)
              ? sub.channels.filter(c => c !== channel)
              : [...sub.channels, channel];
            return { ...sub, channels: newChannels };
          }
          return { ...sub, [field]: value };
        }
        return sub;
      })
    );
  };

  const handleSavePreferences = async () => {
    setSaveStatus('saving');
    try {
      await alertingService.saveUserAlertPreferences(alertPreferences);
      await alertingService.saveScheduledReportSubscriptions(scheduledReports);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000); // Reset status after 2s
    } catch (error) {
      console.error("Failed to save preferences:", error);
      setSaveStatus('error');
    }
  };

  if (isLoading) {
    return <p className="text-secondary-600 dark:text-secondary-400">Loading preferences...</p>;
  }

  return (
    <div className="space-y-6">
      <div className={TAILWIND_SECTION_CLASSES}>
        <h3 className="text-lg font-medium leading-6 text-secondary-900 dark:text-secondary-100 mb-4">Alert Notifications</h3>
        <div className="space-y-4">
          {alertPreferences.map(pref => (
            <div key={pref.alertType} className="p-3 border border-secondary-200 dark:border-secondary-700 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-secondary-800 dark:text-secondary-200">{pref.alertType}</span>
                <label htmlFor={`enable-${pref.alertType}`} className="flex items-center cursor-pointer">
                    <span className="text-xs mr-2 text-secondary-600 dark:text-secondary-400">{pref.enabled ? 'Enabled' : 'Disabled'}</span>
                    <div className="relative">
                        <input 
                            type="checkbox" 
                            id={`enable-${pref.alertType}`} 
                            className="sr-only" 
                            checked={pref.enabled}
                            onChange={(e) => handleAlertEnableChange(pref.alertType, e.target.checked)}
                        />
                        <div className={`block w-10 h-6 rounded-full transition ${pref.enabled ? 'bg-primary-500' : 'bg-secondary-300 dark:bg-secondary-600'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${pref.enabled ? 'translate-x-full' : ''}`}></div>
                    </div>
                </label>
              </div>
              {pref.enabled && (
                <fieldset>
                  <legend className="sr-only">Notification channels for {pref.alertType}</legend>
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    {availableChannels.map(channel => (
                      <div key={channel} className="flex items-center">
                        <input
                          id={`${pref.alertType}-${channel}`}
                          name={`${pref.alertType}-${channel}`}
                          type="checkbox"
                          checked={pref.channels.includes(channel)}
                          onChange={e => handleAlertPreferenceChange(pref.alertType, channel, e.target.checked)}
                          className={TAILWIND_CHECKBOX_CLASSES}
                        />
                        <label htmlFor={`${pref.alertType}-${channel}`} className={TAILWIND_LABEL_CLASSES}>
                          {channel}
                        </label>
                      </div>
                    ))}
                  </div>
                </fieldset>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={TAILWIND_SECTION_CLASSES}>
        <h3 className="text-lg font-medium leading-6 text-secondary-900 dark:text-secondary-100 mb-4">Scheduled Reports</h3>
         <div className="space-y-4">
          {scheduledReports.map(sub => (
            <div key={sub.reportId} className="p-3 border border-secondary-200 dark:border-secondary-700 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-secondary-800 dark:text-secondary-200">{sub.reportName || sub.reportId}</span>
                 <label htmlFor={`enable-report-${sub.reportId}`} className="flex items-center cursor-pointer">
                    <span className="text-xs mr-2 text-secondary-600 dark:text-secondary-400">{sub.enabled ? 'Enabled' : 'Disabled'}</span>
                    <div className="relative">
                        <input 
                            type="checkbox" 
                            id={`enable-report-${sub.reportId}`} 
                            className="sr-only" 
                            checked={sub.enabled}
                            onChange={(e) => handleScheduledReportChange(sub.reportId, 'enabled', e.target.checked)}
                        />
                        <div className={`block w-10 h-6 rounded-full transition ${sub.enabled ? 'bg-primary-500' : 'bg-secondary-300 dark:bg-secondary-600'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${sub.enabled ? 'translate-x-full' : ''}`}></div>
                    </div>
                </label>
              </div>
              {sub.enabled && (
                <>
                  <div className="mb-2">
                    <label htmlFor={`freq-${sub.reportId}`} className="block text-xs font-medium text-secondary-600 dark:text-secondary-400 mb-0.5">Frequency</label>
                    <select
                      id={`freq-${sub.reportId}`}
                      value={sub.frequency}
                      onChange={e => handleScheduledReportChange(sub.reportId, 'frequency', e.target.value as ScheduledReportSubscription['frequency'])}
                      className="mt-1 block w-full py-1.5 px-2 border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-xs"
                    >
                      {availableFrequencies.map(freq => <option key={freq} value={freq}>{freq}</option>)}
                    </select>
                  </div>
                  <fieldset>
                    <legend className="sr-only">Delivery channels for {sub.reportId}</legend>
                     <div className="flex flex-wrap gap-x-6 gap-y-2">
                      {availableChannels.map(channel => (
                        <div key={channel} className="flex items-center">
                          <input
                            id={`${sub.reportId}-${channel}`}
                            name={`${sub.reportId}-${channel}`}
                            type="checkbox"
                            checked={sub.channels.includes(channel)}
                            onChange={() => handleScheduledReportChange(sub.reportId, 'channels', channel)}
                            className={TAILWIND_CHECKBOX_CLASSES}
                          />
                          <label htmlFor={`${sub.reportId}-${channel}`} className={TAILWIND_LABEL_CLASSES}>
                            {channel}
                          </label>
                        </div>
                      ))}
                    </div>
                  </fieldset>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <button
          onClick={handleSavePreferences}
          disabled={saveStatus === 'saving'}
          className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 disabled:opacity-70"
        >
          {saveStatus === 'saving' && 'Saving...'}
          {saveStatus === 'saved' && 'Preferences Saved!'}
          {saveStatus === 'error' && 'Save Error!'}
          {saveStatus === 'idle' && 'Save Preferences'}
        </button>
      </div>
    </div>
  );
};

export default NotificationPreferencesForm;