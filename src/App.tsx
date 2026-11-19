/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { CONFIG, type DriveFileItem, type SheetFolderEntry } from './config';
import { AdminAccessScreen } from './components/AdminAccessScreen';
import { AdminUploadScreen } from './components/AdminUploadScreen';
import { CodeInputScreen } from './components/CodeInputScreen';
import { FilePreviewModal } from './components/FilePreviewModal';
import { FolderViewerScreen } from './components/FolderViewerScreen';
import { IntegrationGuideModal } from './components/IntegrationGuideModal';
import { fetchAdminFolders, verifyAccessCode } from './services/drivePortalService';

interface ActiveSession {
  label: string;
  folderId: string;
  files: DriveFileItem[];
}

interface AdminSession {
  adminCode: string;
  entries: SheetFolderEntry[];
}

type AppViewMode = 'portal' | 'admin-login' | 'admin-workspace';

export default function App() {
  const [viewMode, setViewMode] = useState<AppViewMode>('portal');

  // Sesi pengguna awam
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<DriveFileItem | null>(null);

  // Sesi admin
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [needsScriptUpdate, setNeedsScriptUpdate] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const handleVerifyCode = async (code: string) => {
    setIsVerifying(true);
    setError(null);

    const result = await verifyAccessCode(code);

    setIsVerifying(false);
    if (result.ok) {
      setSession({
        label: result.label,
        folderId: result.folderId,
        files: result.files,
      });
    } else {
      setError(result.error);
    }
  };

  const handleLockExit = () => {
    setPreviewFile(null);
    setError(null);
    setSession(null);
  };

  const handleAdminLogin = async (adminCode: string) => {
    setIsAdminLoading(true);
    setAdminError(null);
    setNeedsScriptUpdate(false);

    const result = await fetchAdminFolders(adminCode);
    setIsAdminLoading(false);

    if (result.ok) {
      setAdminSession({
        adminCode,
        entries: result.entries,
      });
      setViewMode('admin-workspace');
    } else {
      setAdminError(result.error);
      setNeedsScriptUpdate(Boolean(result.needsScriptUpdate));
    }
  };

  const handleAdminLogout = () => {
    setAdminSession(null);
    setAdminError(null);
    setNeedsScriptUpdate(false);
    setViewMode('portal');
  };

  const handleEnterAdminMode = () => {
    setPreviewFile(null);
    setError(null);
    setAdminError(null);
    setNeedsScriptUpdate(false);
    setViewMode(adminSession ? 'admin-workspace' : 'admin-login');
  };

  const isCenteredLayout =
    (viewMode === 'portal' && !session) || viewMode === 'admin-login';

  const activeMotionKey =
    viewMode === 'admin-workspace' && adminSession
      ? 'admin-workspace'
      : viewMode === 'admin-login'
        ? 'admin-login'
        : session
          ? 'folder-screen'
          : 'verify-screen';

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#111827] selection:bg-[#18181B] selection:text-[#FFFFFF]">
        <main
          className={[
            'flex-1 w-full max-w-[900px] mx-auto px-4 sm:px-6',
            isCenteredLayout ? 'py-12 flex flex-col justify-center' : 'py-8 sm:py-12',
          ].join(' ')}
        >
          <AnimatePresence mode="wait" initial={false}>
            {activeMotionKey === 'verify-screen' && (
              <motion.div
                key="verify-screen"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              >
                <CodeInputScreen
                  onVerify={handleVerifyCode}
                  isLoading={isVerifying}
                  error={error}
                  onClearError={() => setError(null)}
                />
              </motion.div>
            )}

            {activeMotionKey === 'folder-screen' && session && (
              <motion.div
                key="folder-screen"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              >
                <FolderViewerScreen
                  label={session.label}
                  files={session.files}
                  onLockExit={handleLockExit}
                  onPreviewFile={setPreviewFile}
                />
              </motion.div>
            )}

            {activeMotionKey === 'admin-login' && (
              <motion.div
                key="admin-login"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              >
                <AdminAccessScreen
                  onLogin={handleAdminLogin}
                  onBackToPortal={() => setViewMode('portal')}
                  onOpenGuide={() => setIsGuideOpen(true)}
                  isLoading={isAdminLoading}
                  error={adminError}
                  needsScriptUpdate={needsScriptUpdate}
                  onClearError={() => {
                    setAdminError(null);
                    setNeedsScriptUpdate(false);
                  }}
                />
              </motion.div>
            )}

            {activeMotionKey === 'admin-workspace' && adminSession && (
              <motion.div
                key="admin-workspace"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              >
                <AdminUploadScreen
                  adminCode={adminSession.adminCode}
                  entries={adminSession.entries}
                  onLogout={handleAdminLogout}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className="w-full max-w-[900px] mx-auto px-4 sm:px-6 py-6 flex items-center justify-between gap-4 text-xs text-[#6B7280] border-t border-[#E5E7EB]/70">
          <span>© Initiated by Unit ICT, SK Kampong Repoh</span>
          <div className="flex items-center gap-3">
            {CONFIG.USE_MOCK_DATA && <span>Mod demo</span>}
            {CONFIG.USE_MOCK_DATA && <span aria-hidden="true">·</span>}
            {viewMode === 'portal' ? (
              <button
                type="button"
                onClick={handleEnterAdminMode}
                className="text-[#6B7280] hover:text-[#111827] underline underline-offset-4 decoration-[#D1D5DB] hover:decoration-[#18181B] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181B] rounded"
              >
                Akses Admin
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setViewMode('portal')}
                className="text-[#6B7280] hover:text-[#111827] underline underline-offset-4 decoration-[#D1D5DB] hover:decoration-[#18181B] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181B] rounded"
              >
                Portal Pengguna
              </button>
            )}
          </div>
        </footer>

        <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
        <IntegrationGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      </div>
    </MotionConfig>
  );
}
