export enum ComplaintStatus {
  NEW = "NEW",
  VERIFIED = "VERIFIED",
  ASSIGNED = "ASSIGNED",
  IN_PROGRESS = "IN_PROGRESS",
  WAITING_GOVT = "WAITING_GOVT",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
  REJECTED = "REJECTED",
}

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  WARD_SECRETARY = "WARD_SECRETARY",
  AREA_COORDINATOR = "AREA_COORDINATOR",
  VOLUNTEER = "VOLUNTEER",
}

export const complaintStatusTamil: Record<ComplaintStatus, string> = {
  [ComplaintStatus.NEW]: "புதியது",
  [ComplaintStatus.VERIFIED]: "சரிபார்க்கப்பட்டது",
  [ComplaintStatus.ASSIGNED]: "ஒதுக்கப்பட்டது",
  [ComplaintStatus.IN_PROGRESS]: "நடவடிக்கையில்",
  [ComplaintStatus.WAITING_GOVT]: "அரசுத் துறைக்காக காத்திருக்கிறது",
  [ComplaintStatus.RESOLVED]: "தீர்க்கப்பட்டது",
  [ComplaintStatus.CLOSED]: "மூடப்பட்டது",
  [ComplaintStatus.REJECTED]: "நிராகரிக்கப்பட்டது",
};

export const userRoleTamil: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: "முதன்மை நிர்வாகி",
  [UserRole.WARD_SECRETARY]: "வார்டு செயலாளர்",
  [UserRole.AREA_COORDINATOR]: "பகுதி ஒருங்கிணைப்பாளர்",
  [UserRole.VOLUNTEER]: "தன்னார்வலர்",
};
