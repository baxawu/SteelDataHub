"use client";

import Link from "next/link";

// Section 39: bắt buộc Admin đổi password sau lần đăng nhập đầu tiên.
export function MustChangePasswordBanner() {
  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-sm px-4 sm:px-6 py-2 flex items-center justify-between">
      <span>Bạn đang dùng mật khẩu mặc định. Vui lòng đổi mật khẩu để bảo mật tài khoản.</span>
      <Link href="/dashboard/settings" className="font-medium underline shrink-0 ml-4">
        Đổi mật khẩu
      </Link>
    </div>
  );
}
