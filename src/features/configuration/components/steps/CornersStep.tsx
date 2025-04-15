import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Save, Table } from 'lucide-react';
import { Button } from '../../../../components/ui';
import {
  useSceneSetup,
  useEdgeVisualization,
  usePartsProcessing,
  useDrawMode
} from '../../hooks/corners';
import { NomenclatureTable } from '../corners/NomenclatureTable';
import type { Part } from '../../../../types';

interface CornersStepProps {
  configId: string | null;
  onBack: () => void;
  onSave: () => void;
  isSaving?: boolean;
  error?: string;
}

export const CornersStep: React.FC<CornersStepProps> = ({
  configId,
  onBack,
  onSave,
  isSaving,
  error
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoadParts, setShouldLoadParts] = useState(false);
  const [showNomenclature, setShowNomenclature] = useState(false);
  
  const { scene, camera, renderer, controls } = useSceneSetup(containerRef);
  const { addPermanentEdge, highlightEdge, resetHighlight } = useEdgeVisualization(scene);
  const { loading, error: partsError, nomenclature } = usePartsProcessing(configId, scene, addPermanentEdge, shouldLoadParts);
  const { drawModeEnabled, toggleDrawMode, animate } = useDrawMode(renderer, scene, camera, controls);

  useEffect(() => {
    if (animate) {
      animate();
    }
  }, [animate]);

  return (
    <div className="relative">
      {(error || partsError) && (
        <div className="absolute inset-0 bg-red-50/80 flex items-center justify-center z-10">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <p className="text-red-600">{error || partsError}</p>
          </div>
        </div>
      )}
      
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-center mb-4">
          <Button
            variant="secondary"
            onClick={() => setShouldLoadParts(true)}
            disabled={shouldLoadParts || loading}
            className="flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
                Chargement des données...
              </>
            ) : (
              <>
                <div className="h-4 w-4 mr-2">📥</div>
                Charger les données
              </>
            )}
          </Button>
        </div>

        <div 
          ref={containerRef} 
          className="w-full h-[600px] bg-gray-50 rounded-lg overflow-hidden"
        />

        <div className="flex items-center justify-center space-x-4">
          <Button
            variant="secondary"
            onClick={toggleDrawMode}
            className="flex items-center"
          >
            {drawModeEnabled ? '🎨 Mode normal' : '📐 Mode dessin technique'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowNomenclature(!showNomenclature)}
            className="flex items-center"
          >
            <Table className="h-4 w-4 mr-2" />
            {showNomenclature ? 'Masquer la nomenclature' : 'Afficher la nomenclature'}
          </Button>
        </div>
        
        <div className="flex justify-between">
          <Button
            variant="secondary"
            onClick={onBack}
            className="flex items-center"
            disabled={isSaving}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <Button
            onClick={onSave}
            className="flex items-center"
            disabled={isSaving}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>

        {showNomenclature && nomenclature && nomenclature.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Nomenclature des arêtes</h3>
            <NomenclatureTable
              nomenclature={nomenclature}
              onEdgeHover={highlightEdge}
              onEdgeLeave={resetHighlight}
            />
          </div>
        )}
      </div>
    </div>
  );
};