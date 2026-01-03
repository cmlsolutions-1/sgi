// components/employee/MedicalEvaluationTab.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Calendar, User, Building, FileText, Download, CheckCircle, CircleDashed, Upload } from "lucide-react";
import { Employee } from "@/lib/mock-data";
import jsPDF from "jspdf";

type MedicalEvaluationType = 'preoccupational' | 'periodic' | 'postoccupational' | 'other';

interface MedicalEvaluation {
  id: string;
  type: MedicalEvaluationType;
  date: string;
  result: 'apt' | 'not_apt' | 'conditionally_apt';
  observations: string;
  phase?: string;
  nextEvaluationDate?: string;
  medicalProfessional?: string;
  entity?: string;
}

interface MedicalEvaluationTabProps {
  employee: Employee;
  onAddEvaluation: (evaluation: MedicalEvaluation) => void;
}

const MEDICAL_EVALUATION_TYPES = [
  { value: 'preoccupational', label: 'Preocupacional/Ingreso', description: 'Al inicio, para verificar condiciones de salud antes de la vinculación' },
  { value: 'periodic', label: 'Periódico', description: 'Regularmente para vigilar exposición a riesgos y detectar alteraciones tempranas' },
  { value: 'postoccupational', label: 'Post-ocupacional/Egreso', description: 'Al finalizar el contrato o vinculación' },
  { value: 'other', label: 'Otro', description: 'Post-incapacidad o por reintegro laboral' }
];

const RESULT_OPTIONS = [
  { value: 'apt', label: 'Apto', color: 'bg-accent/10 text-accent' },
  { value: 'not_apt', label: 'No Apto', color: 'bg-destructive/10 text-destructive' },
  { value: 'conditionally_apt', label: 'Condicionalmente Apto', color: 'bg-warning/10 text-warning' }
];

export function MedicalEvaluationTab({ employee, onAddEvaluation }: MedicalEvaluationTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Omit<MedicalEvaluation, 'id'>>({
    type: 'preoccupational',
    date: new Date().toISOString().split('T')[0],
    result: 'apt',
    observations: '',
    medicalProfessional: '',
    entity: '',
    nextEvaluationDate: ''
  });

  const [file, setFile] = useState<File | null>(null);

  const handleInputChange = (field: keyof MedicalEvaluation, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEvaluation: MedicalEvaluation = {
      ...formData,
      id: `med${Date.now()}`,
      date: formData.date,
      result: formData.result as 'apt' | 'not_apt' | 'conditionally_apt',
      type: formData.type as MedicalEvaluationType
    };
    onAddEvaluation(newEvaluation);
    setDialogOpen(false);
    setFormData({
      type: 'preoccupational',
      date: new Date().toISOString().split('T')[0],
      result: 'apt',
      observations: '',
      medicalProfessional: '',
      entity: '',
      nextEvaluationDate: ''
    });
  };

  const getResultBadge = (result: string) => {
    const option = RESULT_OPTIONS.find(opt => opt.value === result);
    return option ? (
      <Badge variant="secondary" className={`text-xs ${option.color}`}>
        {option.label}
      </Badge>
    ) : null;
  };

  const getTypeLabel = (type: string) => {
    const option = MEDICAL_EVALUATION_TYPES.find(opt => opt.value === type);
    return option ? option.label : type;
  };

  const downloadEvaluation = (evaluation: MedicalEvaluation) => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text(`Evaluación Médico-Ocupacional`, 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Empleado: ${employee.name} ${employee.lastName}`, 20, 40);
    doc.text(`Tipo: ${getTypeLabel(evaluation.type)}`, 20, 50);
    doc.text(`Fecha: ${evaluation.date}`, 20, 60);
    doc.text(`Resultado: ${evaluation.result === 'apt' ? 'Apto' : evaluation.result === 'not_apt' ? 'No Apto' : 'Condicionalmente Apto'}`, 20, 70);
    doc.text(`Profesional Médico: ${evaluation.medicalProfessional || 'N/A'}`, 20, 80);
    doc.text(`Entidad: ${evaluation.entity || 'N/A'}`, 20, 90);
    
    if (evaluation.nextEvaluationDate) {
      doc.text(`Próxima Evaluación: ${evaluation.nextEvaluationDate}`, 20, 100);
    }
    
    doc.text('Observaciones:', 20, 110);
    const obsLines = doc.splitTextToSize(evaluation.observations, 170);
    doc.text(obsLines, 20, 120);
    
    doc.save(`evaluacion-medica-${employee.id}-${evaluation.id}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Resumen de evaluaciones */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Evaluaciones Médico-Ocupacionales
            </CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Evaluación
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border max-w-md">
                <DialogHeader>
                  <DialogTitle>Agregar Evaluación Médico-Ocupacional</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label >Tipo de Evaluación</Label>
                      <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MEDICAL_EVALUATION_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Fecha</Label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                        required
                        className="bg-secondary border-border"
                      />
                    </div>
                    <div>
                      <Label>Resultado</Label>
                      <Select value={formData.result} onValueChange={(value) => handleInputChange('result', value)} >
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent >
                          {RESULT_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value} >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Próxima Evaluación (Opcional)</Label>
                      <Input
                        type="date"
                        value={formData.nextEvaluationDate || ''}
                        onChange={(e) => handleInputChange('nextEvaluationDate', e.target.value)}
                        className="bg-secondary border-border"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Profesional Médico</Label>
                    <Input
                      value={formData.medicalProfessional || ''}
                      onChange={(e) => handleInputChange('medicalProfessional', e.target.value)}
                      placeholder="Nombre del médico"
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div>
                    <Label>Entidad</Label>
                    <Input
                      value={formData.entity || ''}
                      onChange={(e) => handleInputChange('entity', e.target.value)}
                      placeholder="Clínica, hospital, etc."
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div>
                    <Label>Observaciones</Label>
                    <Textarea
                      value={formData.observations}
                      onChange={(e) => handleInputChange('observations', e.target.value)}
                      placeholder="Observaciones del examen médico"
                      required
                      rows={4}
                      className="bg-secondary border-border"
                    />
                  </div>

                  <div className="space-y-2">
            <Label htmlFor="file">Documento (PDF, JPG, PNG)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="bg-secondary border-border"
              />
              <Button type="button" variant="outline" size="icon">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            {file && (
              <p className="text-xs text-muted-foreground">
                Archivo seleccionado: {file.name}
              </p>
            )}
          </div>
                  
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">Guardar Evaluación</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {employee.medicalEvaluations && employee.medicalEvaluations.length > 0 ? (
            <div className="space-y-4">
              {employee.medicalEvaluations.map((evaluation) => (
                <div key={evaluation.id} className="p-4 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">{getTypeLabel(evaluation.type)}</h3>
                        {getResultBadge(evaluation.result)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {evaluation.date}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {evaluation.medicalProfessional || 'Profesional no especificado'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          {evaluation.entity || 'Entidad no especificada'}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadEvaluation(evaluation)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                  
                  <div className="mt-3">
                    <p className="text-sm font-medium mb-1">Observaciones:</p>
                    <p className="text-sm">{evaluation.observations}</p>
                  </div>
                  
                  {evaluation.nextEvaluationDate && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        Próxima evaluación: {evaluation.nextEvaluationDate}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay evaluaciones médico-ocupacionales registradas
            </p>
          )}
        </CardContent>
      </Card>

      {/* Estadísticas */}
      {employee.medicalEvaluations && employee.medicalEvaluations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Evaluaciones</p>
                  <p className="text-2xl font-bold">{employee.medicalEvaluations.length}</p>
                </div>
                <FileText className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Aptos</p>
                  <p className="text-2xl font-bold text-accent">
                    {employee.medicalEvaluations.filter(e => e.result === 'apt').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">No Aptos</p>
                  <p className="text-2xl font-bold text-destructive">
                    {employee.medicalEvaluations.filter(e => e.result === 'not_apt').length}
                  </p>
                </div>
                <CircleDashed className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Periódicos</p>
                  <p className="text-2xl font-bold text-warning">
                    {employee.medicalEvaluations.filter(e => e.type === 'periodic').length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}