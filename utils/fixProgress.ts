/**
 * Data Migration Utility: Fix Progress Calculation
 * 
 * This script recalculates the progress for all projects based on
 * completed stages count instead of current stage index.
 * 
 * Formula: progress = (completedStages.length / totalStages.length) * 100
 */

import { db } from '../firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { DEFAULT_STAGES } from '../constants';

export async function fixAllProjectProgress() {
    try {
        console.log('🔧 Starting progress fix migration...');

        const projectsSnapshot = await getDocs(collection(db, 'projects'));
        let fixedCount = 0;
        let errorCount = 0;

        for (const projectDoc of projectsSnapshot.docs) {
            try {
                const project = projectDoc.data();
                const stages = Array.isArray(project.stages) && project.stages.length > 0
                    ? project.stages
                    : DEFAULT_STAGES;

                const completedStages = Array.isArray(project.completedStages)
                    ? project.completedStages
                    : [];

                let correctProgress;

                // If the project is on the last stage, set progress to 100%
                const isOnLastStage = project.stage === stages[stages.length - 1];
                if (isOnLastStage) {
                    correctProgress = 100;
                } else {
                    // Calculate correct progress based on completed stages
                    correctProgress = Math.round((completedStages.length / stages.length) * 100);
                }

                // Only update if progress is different
                if (project.progress !== correctProgress) {
                    console.log(`📝 Fixing "${project.name}": ${project.progress}% → ${correctProgress}%`);

                    await setDoc(doc(db, 'projects', projectDoc.id), {
                        ...project,
                        progress: correctProgress
                    });

                    fixedCount++;
                } else {
                    console.log(`✅ "${project.name}" already correct: ${correctProgress}%`);
                }
            } catch (error) {
                console.error(`❌ Error fixing project ${projectDoc.id}:`, error);
                errorCount++;
            }
        }

        console.log(`\n✨ Migration complete!`);
        console.log(`   Fixed: ${fixedCount} projects`);
        console.log(`   Errors: ${errorCount} projects`);
        console.log(`   Total: ${projectsSnapshot.docs.length} projects`);

        return { fixedCount, errorCount, total: projectsSnapshot.docs.length };
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}
