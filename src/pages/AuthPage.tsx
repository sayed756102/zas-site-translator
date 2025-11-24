import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Github } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';

const AuthPage = () => {
  const { user, signInWithGoogle, signInWithGithub } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold gradient-text">ZAS</CardTitle>
          <CardDescription>منصة الترجمة الذكية</CardDescription>
          <p className="text-sm text-muted-foreground mt-2">
            سجل دخولك باستخدام
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={signInWithGoogle}
            variant="outline"
            className="w-full h-12 text-base"
          >
            <FcGoogle className="ml-2 h-5 w-5" />
            المتابعة مع Google
          </Button>
          
          <Button
            onClick={signInWithGithub}
            variant="outline"
            className="w-full h-12 text-base"
          >
            <Github className="ml-2 h-5 w-5" />
            المتابعة مع GitHub
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
