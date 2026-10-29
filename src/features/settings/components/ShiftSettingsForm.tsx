import React, { useState, useEffect } from 'react';
import { useSettings } from '../hooks/useSettings';
import { settingsService } from '../services/settingsService';
import { useShift } from '../../../app/providers/ShiftProvider';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { FormSkeleton } from '../../../components/skeletons/FormSkeleton';
import { Clock, CheckCircle2, AlertCircle, Sun, Moon } from 'lucide-react';

export const ShiftSettingsForm: React.FC = () => {
  const { settings, isLoading, refreshSettings } = useSettings();
  const { refreshShift } = useShift();

  const [dairyName, setDairyName] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [morningStart, setMorningStart] = useState('06:00');
  const [morningEnd, setMorningEnd] = useState('18:00');
  const [eveningStart, setEveningStart] = useState('18:00');
  const [eveningEnd, setEveningEnd] = useState('06:00');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setDairyName(settings.dairy_name || '');
      setTimezone(settings.timezone || 'Asia/Kolkata');
      setMorningStart(settings.morning_start.slice(0, 5));
      setMorningEnd(settings.morning_end.slice(0, 5));
      setEveningStart(settings.evening_start.slice(0, 5));
      setEveningEnd(settings.evening_end.slice(0, 5));
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dairyName.trim()) {
      setErrorMsg('Dairy name is required');
      return;
    }

    setIsSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await settingsService.updateShiftSettings({
        dairy_name: dairyName,
        timezone,
        morning_start: `${morningStart}:00`,
        morning_end: `${morningEnd}:00`,
        evening_start: `${eveningStart}:00`,
        evening_end: `${eveningEnd}:00`,
      });
      setSuccessMsg('Shift timings updated successfully. New shifts will apply to future transactions.');
      await refreshSettings();
      await refreshShift();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update shift settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !settings) {
    return <FormSkeleton fields={6} />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Shift & Operational Settings"
        subtitle="Configure morning and evening operational shift hours and dairy timezone."
      />

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded text-emerald-900 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-300 rounded text-rose-900 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <Card className="border-[#afc4d4]">
        <CardHeader className="bg-[#F5EFEB] py-3.5">
          <CardTitle className="text-sm">Configured Shift Operating Windows</CardTitle>
          <span className="text-xs text-[#567C8D]">Admin only</span>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Dairy Config */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Dairy Organization Name"
                required
                value={dairyName}
                onChange={(e) => setDairyName(e.target.value)}
                disabled={isSubmitting}
              />
              <Input
                label="Server Operating Timezone"
                required
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                disabled={isSubmitting}
                helperText="Standard timezone: Asia/Kolkata"
              />
            </div>

            {/* Morning Shift Config */}
            <div className="bg-[#F5EFEB] p-4 rounded border border-[#afc4d4] space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2F4156]">
                <Sun className="w-4 h-4 text-amber-600" />
                <span>Morning Shift Hours</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Morning Start Time"
                  type="time"
                  required
                  value={morningStart}
                  onChange={(e) => setMorningStart(e.target.value)}
                  disabled={isSubmitting}
                />
                <Input
                  label="Morning End Time"
                  type="time"
                  required
                  value={morningEnd}
                  onChange={(e) => setMorningEnd(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Evening Shift Config */}
            <div className="bg-[#F5EFEB] p-4 rounded border border-[#afc4d4] space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2F4156]">
                <Moon className="w-4 h-4 text-[#2F4156]" />
                <span>Evening Shift Hours</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Evening Start Time"
                  type="time"
                  required
                  value={eveningStart}
                  onChange={(e) => setEveningStart(e.target.value)}
                  disabled={isSubmitting}
                />
                <Input
                  label="Evening End Time"
                  type="time"
                  required
                  value={eveningEnd}
                  onChange={(e) => setEveningEnd(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Historical Rule Clarification */}
            <p className="text-xs text-[#567C8D]">
              Note: Updating shift timings affects only incoming new transactions. Past historical collection and sale records permanently preserve their assigned shifts.
            </p>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                loadingText="Updating shift timings..."
              >
                Save Shift Configuration
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
