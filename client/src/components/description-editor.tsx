import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface DescriptionEditorProps {
  value: string;
  onChange: (v: string) => void;
  onSave: () => Promise<void> | void;
  onCancel: () => void;
  placeholder?: string;
  rows?: number;
}

export const DescriptionEditor: React.FC<DescriptionEditorProps> = ({ value, onChange, onSave, onCancel, placeholder, rows = 4 }) => {
  return (
    <div className="bg-white p-3 rounded border border-gray-200">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder || "Adicione uma descrição mais detalhada..."}
        aria-label="Descrição"
        className="w-full"
      />
      <div className="flex items-center gap-2 mt-2">
        <Button size="sm" onClick={onSave}>Salvar</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancelar</Button>
      </div>
    </div>
  );
};

export default DescriptionEditor;
