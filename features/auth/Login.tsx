
import React, { useContext, useState } from 'react';
import { AppContext } from '../../App';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { AlertCircle } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { StageFlowLogoIcon } from '../../components/icons/StageFlowLogoIcon';

export const Login: React.FC = () => {
    const { login } = useContext(AppContext);
    const [email, setEmail] = useState('hannes@stageflow.be');
    const [password, setPassword] = useState('password');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const success = login(email, password);
        if (!success) {
            setError('Ongeldige e-mail of wachtwoord.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-secondary p-4">
            <Card className="w-full max-w-sm mx-auto shadow-2xl rounded-2xl border-none">
                <CardHeader className="text-center space-y-4 pt-10">
                    <div className="flex flex-col items-center justify-center space-y-2">
                        <StageFlowLogoIcon className="h-10 w-10 text-primary" />
                        <h1 className="text-4xl font-bold">StageFlow</h1>
                    </div>
                    <CardTitle className="text-2xl !mt-2">Welkom terug</CardTitle>
                    <CardDescription>Log in om verder te gaan</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="jouw@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                             <label htmlFor="password" className="block text-sm font-medium text-muted-foreground mb-1">Wachtwoord</label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        {error && (
                            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                                <AlertCircle className="h-4 w-4" />
                                {error}
                            </div>
                        )}
                        <Button type="submit" className="w-full !mt-6">Inloggen</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};
