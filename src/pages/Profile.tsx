import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import MainLayout from '@/components/MainLayout';
import ProfileSidebar from '@/components/ProfileSidebar';
import { useAuth } from '@/context/AuthContext';
import { updateUserProfile } from '@/lib/firebase';
import { getAuth } from "firebase/auth";
import { EmailAuthProvider, updateProfile, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { Loader } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const Profile: React.FC = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const auth = getAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.displayName || '');
      setPhone(userProfile?.phone || '');
      setDataLoaded(true);
    }
  }, [currentUser, userProfile]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (currentUser) {
        await updateProfile(currentUser, { displayName: name });
        await updateUserProfile(currentUser.uid, {
          displayName: name,
          phone,
        });
      }

      toast({
        title: "Успех",
        description: "Профиль успешно обновлен.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message || "Не удалось обновить профиль.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Новые пароли не совпадают.",
      });
      return;
    }

    setLoading(true);

    try {
      if (currentUser && currentUser.email) {
        const credential = EmailAuthProvider.credential(
          currentUser.email,
          currentPassword
        );

        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, newPassword);

        toast({
          title: "Успех",
          description: "Пароль успешно изменен.",
        });

        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message || "Не удалось изменить пароль.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout showSidebar>
      <div className="container max-w-5xl mx-auto py-4 px-2 sm:py-6">

        {!dataLoaded ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">Профиль</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="profile">Профиль</TabsTrigger>
                  <TabsTrigger value="password">Пароль</TabsTrigger>
                </TabsList>
                <TabsContent value="profile" className="pt-4">
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={currentUser?.email || ''}
                        disabled
                      />
                      <p className="text-sm text-muted-foreground">
                        Email не может быть изменен
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Имя</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Телефон</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+998 XX XXX XX XX"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? "Обновление..." : "Обновить профиль"}
                    </Button>
                  </form>
                </TabsContent>
                <TabsContent value="password" className="pt-4">
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Текущий пароль</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Новый пароль</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? "Изменение..." : "Изменить пароль"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default Profile;