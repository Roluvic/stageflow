import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Package } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description }) => {
  return (
    <div className="flex items-center justify-center h-full">
      <Card className="w-full max-w-lg text-center rounded-2xl shadow-lg">
        <CardHeader>
          <div className="mx-auto bg-primary/10 text-primary p-4 rounded-full w-fit">
            <Package className="h-10 w-10" />
          </div>
          <CardTitle className="!mt-6 text-3xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-lg">
            {description || 'Deze feature is binnenkort beschikbaar. We werken er hard aan!'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
