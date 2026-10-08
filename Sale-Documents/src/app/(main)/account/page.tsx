'use client';

import { useEffect, useState, useRef } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Profile form state
  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [school, setSchool] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Avatar upload state
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [supabase] = useState(() => createBrowserClient());
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    async function fetchProfile() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session?.user && mounted) {
          setUser(session.user);
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (data && mounted) {
            setProfile(data);
            setFullName(data.full_name || '');
            setNickname(data.nickname || '');
            setSchool(data.school || '');
            setAvatarUrl(data.avatar_url || '');
          }
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    fetchProfile();
    return () => { mounted = false; };
  }, [supabase]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          nickname: nickname,
          school: school,
        })
        .eq('id', user.id);
      
      if (error) throw error;
      alert('Cập nhật hồ sơ thành công!');
    } catch (err: any) {
      console.error("Lỗi cập nhật hồ sơ:", err);
      alert('Cập nhật hồ sơ thất bại: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      // 1. Verify password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: deletePassword,
      });

      if (signInError) {
        throw new Error('Mật khẩu không chính xác.');
      }

      // 2. Call API to delete user
      const response = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Lỗi khi xóa tài khoản');
      }

      // 3. Sign out and redirect
      await supabase.auth.signOut();
      router.push('/');
      alert('Tài khoản đã được xóa vĩnh viễn.');
    } catch (err: any) {
      console.error("Lỗi xóa tài khoản:", err);
      alert('Lỗi: ' + err.message);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 10 * 1024 * 1024) {
        alert('File quá lớn, vui lòng chọn ảnh dưới 10MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file hình ảnh');
        return;
      }

      // Optimistic UI: Hiện ảnh ngay lập tức
      const objectUrl = URL.createObjectURL(file);
      setAvatarUrl(objectUrl);
      setIsUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      // Xóa objectURL để tránh rò rỉ bộ nhớ
      URL.revokeObjectURL(objectUrl);
      setAvatarUrl(publicUrl);
      
      // Đồng bộ Header
      window.dispatchEvent(new Event('avatarUpdated'));
      alert('Cập nhật ảnh đại diện thành công');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      alert('Lỗi cập nhật ảnh đại diện: ' + error.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAvatar = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa ảnh đại diện này không?')) return;
    if (!user || !avatarUrl) return;
    setIsDeletingAvatar(true);
    try {
      // Step 1: Remove from storage
      const urlParts = avatarUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      if (fileName) {
        await supabase.storage.from('avatars').remove([fileName]);
      }

      // Step 2: Update DB
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Step 3: Update UI
      setAvatarUrl('');
      
      // Đồng bộ Header
      window.dispatchEvent(new Event('avatarUpdated'));
      alert('Đã xóa ảnh đại diện');
    } catch (error: any) {
      console.error('Error deleting avatar:', error);
      alert('Lỗi khi xóa ảnh: ' + error.message);
    } finally {
      setIsDeletingAvatar(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 pt-24 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Tài khoản của tôi</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold dark:text-gray-100 mb-4 border-b dark:border-gray-700 pb-3">Hồ sơ cá nhân</h2>
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div 
                      className="relative w-24 h-24 rounded-full bg-slate-700 border-2 border-gray-100 dark:border-gray-600 flex items-center justify-center overflow-hidden cursor-pointer group flex-shrink-0 shadow-sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {avatarUrl ? (
                        <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
                      ) : (
                        <span className="text-3xl font-bold text-white uppercase">{fullName ? fullName.charAt(0) : user?.email?.charAt(0) || 'U'}</span>
                      )}
                      
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {isUploading ? (
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()} 
                        disabled={isUploading || isDeletingAvatar}
                        className="px-4 py-2 border border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400 font-medium rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition text-sm text-left w-fit disabled:opacity-50"
                      >
                        Thay đổi ảnh đại diện
                      </button>
                      {avatarUrl && (
                        <button 
                          type="button" 
                          onClick={handleDeleteAvatar} 
                          disabled={isUploading || isDeletingAvatar}
                          className="px-4 py-1 text-red-500 hover:text-red-700 font-medium transition text-sm text-left w-fit disabled:opacity-50"
                        >
                          {isDeletingAvatar ? 'Đang xóa...' : 'Xóa ảnh'}
                        </button>
                      )}
                      <p className="text-xs text-gray-500 mt-1">Hỗ trợ JPG, PNG (Tối đa 10MB)</p>
                    </div>
                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleAvatarUpload} />
                  </div>

                  <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Họ tên</label>
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full mt-1 p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:border-blue-500 transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Biệt danh</label>
                    <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} className="w-full mt-1 p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:border-blue-500 transition" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Trường học</label>
                  <input type="text" value={school} onChange={(e) => setSchool(e.target.value)} className="w-full mt-1 p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:border-blue-500 transition" />
                </div>
                <div className="pt-2">
                  <button type="button" onClick={handleUpdateProfile} disabled={isUpdating} className="bg-blue-600 text-white font-medium px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                    {isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </form>
              </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold dark:text-gray-100 mb-4 border-b dark:border-gray-700 pb-3">Tài liệu đã mua</h2>
              <ul className="space-y-3">
                <li className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center border border-gray-100 dark:border-gray-600">
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white">Combo 50 Đề Toán Trọng Tâm 2026</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Đã mua ngày: 01/10/2026</p>
                  </div>
                  <a href="#" className="mt-3 sm:mt-0 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-lg text-sm font-medium transition">Tải xuống</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="md:col-span-4 space-y-6">
            {profile?.is_premium ? (
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl shadow-sm border border-yellow-200 dark:border-yellow-700/30 p-6">
                <h2 className="text-xl font-bold text-yellow-800 dark:text-yellow-500 mb-2">Thành viên Premium</h2>
                <p className="text-yellow-700 dark:text-yellow-600 text-sm mb-4">Bạn đang có các đặc quyền tải tài liệu không giới hạn.</p>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-yellow-100 dark:border-gray-700 flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Thời hạn còn:</span>
                  <span className="font-bold text-gray-900 dark:text-white">30 ngày</span>
                </div>
                <button className="w-full mt-4 bg-yellow-500 text-white font-medium py-2 rounded-lg hover:bg-yellow-600 transition shadow-sm">Gia hạn ngay</button>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Chưa đăng ký Premium</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Mở khóa tải tài liệu không giới hạn chỉ với 59K/tháng</p>
                <button className="w-full bg-yellow-500 text-white font-medium py-2 rounded-lg hover:bg-yellow-600 transition shadow-sm">Đăng ký Premium ngay</button>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-lg font-bold dark:text-gray-100 mb-3">Mã giới thiệu</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Mời bạn bè đăng ký để nhận thêm 7 ngày Premium miễn phí.</p>
              <div className="flex gap-2">
                <input type="text" readOnly value="REF-XYZ123" className="flex-1 p-2 text-sm border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none" />
                <button className="bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition">Copy</button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-red-100 dark:border-red-900/30 p-6">
              <h2 className="text-lg font-bold text-red-600 mb-2">Vùng nguy hiểm</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Hành động này không thể hoàn tác. Dữ liệu của bạn sẽ bị xóa vĩnh viễn.</p>
              <button onClick={() => setIsDeleteModalOpen(true)} className="w-full text-red-600 font-medium px-4 py-2 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition">Xóa tài khoản</button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full p-6 space-y-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Xóa tài khoản</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Bạn có chắc chắn muốn xóa tài khoản không? Hành động này không thể hoàn tác. Vui lòng nhập mật khẩu để xác nhận.
            </p>
            <input 
              type="password" 
              placeholder="Nhập mật khẩu của bạn" 
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:border-red-500 transition"
            />
            <div className="flex gap-3 justify-end pt-2">
              <button 
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeletePassword('');
                }}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                Hủy
              </button>
              <button 
                onClick={handleDeleteAccount}
                disabled={isDeleting || !deletePassword}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {isDeleting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
