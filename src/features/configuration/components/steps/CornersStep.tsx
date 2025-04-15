import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowLeft, Save, Table } from 'lucide-react';
import { Button } from '../../../../components/ui';
import {
  useSceneSetup,
  useEdgeVisualization,
  usePartsProcessing,
  useDrawMode
} from '../../hooks/corners';
import { NomenclatureTable } from '../corners/NomenclatureTable';

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
  error: externalError
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoadParts, setShouldLoadParts] = useState(false);
  const [showNomenclature, setShowNomenclature] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false); // ✅ indicateur pour message succès

  // === Callback après chargement ===
  const handlePartsLoaded = useCallback(() => {
    setShouldLoadParts(false);
    setHasLoaded(true); // ✅ succès
  }, []);

  // === Initialisation de la scène ===
  const {
    sceneRef,
    cameraRef,
    rendererRef,
    controlsRef
  } = useSceneSetup(containerRef);

  const { addPermanentEdge, highlightEdge, resetHighlight } = useEdgeVisualization(sceneRef.current);

  const {
    loading,
    error: partsError,
    nomenclature
  } = usePartsProcessing(
    configId,
    sceneRef.current,
    addPermanentEdge,
    shouldLoadParts,
    handlePartsLoaded
  );

  const {
    drawModeEnabled,
    toggleDrawMode,
    animate
  } = useDrawMode(
    rendererRef,
    sceneRef,
    cameraRef,
    controlsRef
  );

  useEffect(() => {
    if (drawModeEnabled) animate();
  }, [drawModeEnabled, animate]);

  const renderError = externalError || partsError;

  return (
    <div className="relative">
      {/* === Affichage erreur === */}
      {renderError && (
        <div className="absolute inset-0 bg-red-50/80 flex items-center justify-center z-10">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <p className="text-red-600 text-sm">{renderError}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col space-y-4">
        {/* === Bouton de chargement === */}
        <div className="flex flex-col items-center space-y-2">
          <Button
            variant="secondary"
            onClick={() => {
              setShouldLoadParts(true);
              setHasLoaded(false); // reset message de succès
            }}
            disabled={shouldLoadParts || loading}
            className="flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2" />
                Chargement des données...
              </>
            ) : (
              <>
                <div className="h-4 w-4 mr-2">📥</div>
                Charger les données
              </>
            )}
          </Button>

          {/* ✅ Message succès */}
          {hasLoaded && !loading && !renderError && (
            <p className="text-sm text-green-600">✅ Données chargées avec succès</p>
          )}
        </div>

        {/* === Scène 3D === */}
        <div
          ref={containerRef}
          className="w-full h-[600px] bg-gray-50 rounded-lg overflow-hidden"
        />

        {/* === Contrôles utilisateur === */}
        <div className="flex justify-center space-x-4">
          <Button
            variant="secondary"
            onClick={toggleDrawMode}
            className="flex items-center"
            aria-pressed={drawModeEnabled}
          >
            {drawModeEnabled ? '🎨 Mode normal' : '📐 Mode dessin technique'}
          </Button>

          <Button
            variant="secondary"
            onClick={() => setShowNomenclature(prev => !prev)}
            className="flex items-center"
            aria-expanded={showNomenclature}
          >
            <Table className="h-4 w-4 mr-2" />
            {showNomenclature ? 'Masquer la nomenclature' : 'Afficher la nomenclature'}
          </Button>
        </div>

        {/* === Navigation bas === */}
        <div className="flex justify-between">
          <Button
            variant="secondary"
            onClick={onBack}
            disabled={isSaving}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>

        {/* === Nomenclature visible === */}
        {showNomenclature && nomenclature?.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Nomenclature des arêtes
            </h3>
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
