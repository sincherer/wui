import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/shadcn/components/ui/dialog';
import { Button } from '../ui/shadcn/components/ui/button';
import { Input } from '../ui/shadcn/components/ui/input';
import { Label } from '../ui/shadcn/components/ui/label';

type ServiceConfig = {
  title: string;
  fields: {
    label: string;
    type: 'text' | 'password';
    placeholder: string;
  }[];
};

interface AuthModalProps {
  service: 'vercel' | 'github' | 'netlify' | 'surge';
  onClose: () => void;
  onAuthSuccess: (credentials: Record<string, string>) => Promise<void>;
  websiteId: string;
}

const serviceConfigs: Record<string, ServiceConfig> = {
  vercel: {
    title: 'Vercel Authentication',
    fields: [
      {
        label: 'Access Token',
        type: 'password',
        placeholder: 'Enter your Vercel access token',
      },
    ],
  },
  github: {
    title: 'GitHub Authentication',
    fields: [
      {
        label: 'Personal Access Token',
        type: 'password',
        placeholder: 'Enter your GitHub PAT',
      },
    ],
  },
  netlify: {
    title: 'Netlify Authentication',
    fields: [
      {
        label: 'API Key',
        type: 'password',
        placeholder: 'Enter your Netlify API key',
      },
    ],
  },
  surge: {
    title: 'Surge Credentials',
    fields: [
      {
        label: 'Email',
        type: 'text',
        placeholder: 'Enter your Surge email'
      },
      {
        label: 'Password',
        type: 'password',
        placeholder: 'Enter your Surge password'
      }
    ]
  }
};

export const AuthModal = ({ service, onClose, onAuthSuccess, websiteId }: AuthModalProps) => {
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const config = serviceConfigs[service];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await onAuthSuccess(credentials);
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {config.fields.map((field, index) => (
            <div key={index} className="space-y-2">
              <Label>{field.label}</Label>
              <Input
                type={field.type}
                placeholder={field.placeholder}
                required
                onChange={(e) =>
                  setCredentials((prev) => ({
                    ...prev,
                    [field.label.toLowerCase().replace(' ', '_')]: e.target.value,
                  }))
                }
              />
            </div>
          ))}
          {service === 'surge' && (
            <div className="space-y-2">
              <Label>Deployment Domain</Label>
              <Input
                value={`${websiteId}.surge.sh`}
                readOnly
                className="w-full bg-muted"
              />
            </div>
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Authenticating...' : 'Continue'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};