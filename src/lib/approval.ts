/** Students with a school address can use their account right away. */
export const AUTO_APPROVE_EMAIL_DOMAIN = 'stuebenhofer-weg.de'

export function isAutoApprovedEmail(email: string) {
  return email.trim().toLowerCase().endsWith(`@${AUTO_APPROVE_EMAIL_DOMAIN}`)
}

/** Everyone else waits until a teacher or admin approves them; staff always counts as approved. */
export function isApproved(user: {
  approvedAt: Date | null
  isTeacher: boolean | null
  isAdmin: boolean | null
}) {
  return !!user.approvedAt || user.isTeacher === true || user.isAdmin === true
}
