import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "../lib/queryClient";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { AlertCircle, Check, Eye, EyeOff, Lock } from "lucide-react";
import { Alert, AlertDescription } from "../components/ui/alert";

export default function RequiredPasswordReset() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();
  const { user } = useAuth();

  // Redirecionar se não precisar resetar senha
  useEffect(() => {
    if (user && !user.requirePasswordReset) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Validação de força de senha
  const validatePasswordStrength = (password: string) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;

    return {
      isLongEnough,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasSpecialChar,
      isValid: isLongEnough && hasUpperCase && hasLowerCase && hasNumber,
    };
  };

  const passwordStrength = validatePasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newPassword || !confirmPassword) {
      setError("Por favor, preencha todos os campos");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (!passwordStrength.isValid) {
      setError("A senha não atende aos requisitos mínimos de segurança");
      return;
    }

    setLoading(true);

    try {
      await apiRequest("POST", `/api/users/${user?.id}/required-password-change`, { newPassword });

      setSuccess(true);
      
      // Atualizar dados do usuário
      await queryClient.invalidateQueries({ queryKey: ['/api/user'] });

      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Não renderizar nada se não precisar resetar
  if (!user?.requirePasswordReset) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Alteração de Senha Obrigatória</CardTitle>
          <CardDescription className="text-base">
            Por motivos de segurança, você precisa alterar sua senha antes de continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <Alert className="bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Senha alterada com sucesso! Redirecionando...
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Digite sua nova senha"
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {newPassword && (
                <div className="space-y-2 p-3 bg-gray-50 rounded-md text-sm">
                  <p className="font-medium text-gray-700">Requisitos da senha:</p>
                  <ul className="space-y-1">
                    <li className={passwordStrength.isLongEnough ? "text-green-600" : "text-gray-500"}>
                      {passwordStrength.isLongEnough ? "✓" : "○"} Mínimo de 8 caracteres
                    </li>
                    <li className={passwordStrength.hasUpperCase ? "text-green-600" : "text-gray-500"}>
                      {passwordStrength.hasUpperCase ? "✓" : "○"} Uma letra maiúscula
                    </li>
                    <li className={passwordStrength.hasLowerCase ? "text-green-600" : "text-gray-500"}>
                      {passwordStrength.hasLowerCase ? "✓" : "○"} Uma letra minúscula
                    </li>
                    <li className={passwordStrength.hasNumber ? "text-green-600" : "text-gray-500"}>
                      {passwordStrength.hasNumber ? "✓" : "○"} Um número
                    </li>
                    <li className={passwordStrength.hasSpecialChar ? "text-green-600" : "text-gray-500"}>
                      {passwordStrength.hasSpecialChar ? "✓" : "○"} Um caractere especial (recomendado)
                    </li>
                  </ul>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme sua nova senha"
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-sm text-red-600">As senhas não coincidem</p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !passwordStrength.isValid || newPassword !== confirmPassword}
              >
                {loading ? "Alterando..." : "Alterar Senha"}
              </Button>

              <p className="text-xs text-center text-gray-500 mt-4">
                Esta é uma medida de segurança obrigatória. Você não poderá acessar o sistema até alterar sua senha.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
