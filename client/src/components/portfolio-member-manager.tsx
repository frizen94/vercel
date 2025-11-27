import { useState } from "react";
import { UserPlus, UserX, Edit, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface PortfolioMember extends User {
  role: string;
}

interface PortfolioMemberManagerProps {
  portfolioId: number;
}

export function PortfolioMemberManager({ portfolioId }: PortfolioMemberManagerProps) {
  const [open, setOpen] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [selectedUsername, setSelectedUsername] = useState("");
  const [selectedRole, setSelectedRole] = useState("viewer");
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { data: portfolio } = useQuery({
    queryKey: ["/api/portfolios", portfolioId],
    queryFn: async () => {
      const response = await fetch(`/api/portfolios/${portfolioId}`);
      if (!response.ok) throw new Error("Falha ao carregar portfólio");
      return response.json();
    },
  });

  const { data: members = [], refetch } = useQuery<PortfolioMember[]>({
    queryKey: [`/api/portfolios/${portfolioId}/members`],
    enabled: !!portfolioId,
  });

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: open,
  });

  // Filtrar usuários que não são admins e não são membros do portfólio
  const availableUsers = allUsers.filter(
    (u) => u.role !== "admin" && !members.some((m) => m.id === u.id)
  );

  const addMemberMutation = useMutation({
    mutationFn: async ({ username, role }: { username: string; role: string }) => {
      const res = await apiRequest("POST", `/api/portfolios/${portfolioId}/members`, {
        username,
        role,
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/portfolios/${portfolioId}/members`] });
      toast({
        title: "Sucesso",
        description: "Membro adicionado ao portfólio",
      });
      setSelectedUsername("");
      setSelectedRole("viewer");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("DELETE", `/api/portfolios/${portfolioId}/members/${userId}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/portfolios/${portfolioId}/members`] });
      toast({
        title: "Sucesso",
        description: "Membro removido do portfólio",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      const res = await apiRequest("PUT", `/api/portfolios/${portfolioId}/members/${userId}`, {
        role,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Falha ao atualizar papel");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/portfolios/${portfolioId}/members`] });
      toast({
        title: "Sucesso",
        description: "Papel do membro atualizado",
      });
      setIsEditMode(false);
      setSelectedMemberId(null);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    },
  });

  const handleAddMember = () => {
    if (selectedUsername.trim()) {
      addMemberMutation.mutate({
        username: selectedUsername.trim(),
        role: selectedRole,
      });
    }
  };

  const handleRemoveMember = (userId: number) => {
    removeMemberMutation.mutate(userId);
  };

  const handleUpdateRole = (userId: number, role: string) => {
    updateRoleMutation.mutate({ userId, role });
  };

  const isOwner = user?.id === portfolio?.userId;
  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const canManageMembers = isOwner || isAdmin;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Gerenciar Membros
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Gerenciar Membros do Portfólio</DialogTitle>
          <DialogDescription>
            Adicione ou remova membros do portfólio. Apenas membros do portfólio podem ser adicionados aos projetos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Adicionar Membro */}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                Nome de usuário
              </label>
              <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={comboboxOpen}
                    className="w-full justify-between"
                  >
                    {selectedUsername || "Selecione um usuário..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Digite o nome ou usuário..." />
                    <CommandList>
                      <CommandEmpty>Nenhum usuário encontrado.</CommandEmpty>
                      <CommandGroup>
                        {availableUsers.map((u) => (
                          <CommandItem
                            key={u.id}
                            value={u.username}
                            onSelect={(currentValue) => {
                              setSelectedUsername(currentValue === selectedUsername ? "" : currentValue);
                              setComboboxOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedUsername === u.username ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">{u.name || u.username}</span>
                              <span className="text-xs text-muted-foreground">@{u.username}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="w-[140px]">
              <label className="text-sm font-medium mb-2 block">
                Papel
              </label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Visualizador</SelectItem>
                  <SelectItem value="member">Membro</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleAddMember}
              disabled={!selectedUsername.trim() || addMemberMutation.isPending}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>

          {/* Lista de Membros */}
          <div>
            <h4 className="text-sm font-medium mb-2">Membros Atuais</h4>
            <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto">
              {members.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  Nenhum membro ainda
                </div>
              ) : (
                members.map((member) => (
                  <div
                    key={member.id}
                    className="p-3 flex items-center justify-between hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {member.name?.charAt(0).toUpperCase() || member.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-sm">{member.name || member.username}</div>
                        <div className="text-xs text-muted-foreground">@{member.username}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isEditMode && selectedMemberId === member.id ? (
                        <>
                          <Select
                            value={selectedRole}
                            onValueChange={(value) => {
                              setSelectedRole(value);
                              handleUpdateRole(member.id, value);
                            }}
                          >
                            <SelectTrigger className="w-[130px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="viewer">Visualizador</SelectItem>
                              <SelectItem value="member">Membro</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setIsEditMode(false);
                              setSelectedMemberId(null);
                            }}
                          >
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="text-xs bg-secondary px-2 py-1 rounded">
                            {member.role === "viewer" ? "Visualizador" : member.role === "admin" ? "Admin" : "Membro"}
                          </span>
                          {canManageMembers && member.id !== user?.id && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setIsEditMode(true);
                                  setSelectedMemberId(member.id);
                                  setSelectedRole(member.role);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleRemoveMember(member.id)}
                              >
                                <UserX className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
