@@ .. @@
 import { useNavigate, useParams } from 'react-router-dom';
 import { AlertCircle, Save, ArrowLeft, ArrowRight, Loader2, Info, X, DollarSign, Box as Box3d, Ruler } from 'lucide-react';
-import { configurationApi } from '../../../services/api';
+import { useEditorApi, useConfigurationsApi } from '../../../services/api/hooks';
 import { Button } from '../../../components/ui';
 import {
   ConfigurationHeader,
@@ .. @@
   const [error, setError] = useState<string | null>(null);
   const [isSaving, setIsSaving] = useState(false);
   const [configId, setConfigId] = useState<string | null>(null);
+  const { createConfiguration } = useConfigurationsApi();
+  const { getConfiguration } = useEditorApi();

   const handleBasicInfoSubmit = useCallback(async (
     step1Data: Step1FormData,
     isExistingConfig: boolean
   ) => {
     try {
       setLoading(true);
       setError(null);

       const basePayload = {
         configuration_name: step1Data.config_name.trim().toUpperCase(),
         is_catalog: step1Data.is_catalog
       };
       
       if (!isExistingConfig) {
-        const result = await configurationApi.initializeConfiguration(basePayload);
-        if (result.error) {
-          throw new Error(result.error);
-        }
-        if (!result.data.configuration_id) {
-          throw new Error('Erreur serveur: ID de configuration manquant');
-        }
-        setConfigId(result.data.configuration_id);
+        const newConfigId = await createConfiguration(basePayload);
+        setConfigId(newConfigId);
       }

       setCurrentStep('dimensions');
     } catch (err) {
       console.error('Configuration update/init error:', err);
       throw new Error(err instanceof Error ? err.message : 'Erreur lors de la création. Veuillez réessayer.');
     } finally {
       setLoading(false);
     }
   }, []);