package noran.desktop.Controllers;

import java.io.Serializable;
import java.util.Date;
import java.util.Objects;

public class User implements Serializable {

    private static final long serialVersionUID = 1L;

    private String id;
    private String name;
    private String role;
    private String email;

    // Additional employee fields for caching
    private String phone;
    private String fullname;
    private String username;
    private String employeeType;
    private boolean verified;
    private boolean active;
    private double wallet;
    private boolean suspended;
    private Date createdAt;
    private Date updatedAt;
    private String profilePhoto;

    public User() {
    }

    public User(String id, String name) {
        this.id = id;
        this.name = name;
    }

    public User(String id, String name, String role) {
        this.id = id;
        this.name = name;
        this.role = role;
    }

    public User(String id, String name, String role, String email) {
        this.id = id;
        this.name = name;
        this.role = role;
        this.email = email;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    // Additional getters and setters
    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getFullname() {
        return fullname;
    }

    public void setFullname(String fullname) {
        this.fullname = fullname;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmployeeType() {
        return employeeType;
    }

    public void setEmployeeType(String employeeType) {
        this.employeeType = employeeType;
    }

    public boolean isVerified() {
        return verified;
    }

    public void setVerified(boolean verified) {
        this.verified = verified;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public Date getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Date updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getProfilePhoto() {
        return profilePhoto;
    }

    public void setProfilePhoto(String profilePhoto) {
        this.profilePhoto = profilePhoto;
    }

    public double getWallet() {
        return wallet;
    }

    public void setWallet(double wallet) {
        this.wallet = wallet;
    }

    public boolean isSuspended() {
        return suspended;
    }

    public void setSuspended(boolean suspended) {
        this.suspended = suspended;
    }

    /**
     * Check if this user has admin role
     * 
     * @return true if role is "admin" (case-insensitive)
     */
    public boolean isAdmin() {
        return role != null && role.equalsIgnoreCase("admin");
    }

    @Override
    public String toString() {
        return "User{" +
                "id='" + id + '\'' +
                ", name='" + name + '\'' +
                ", role='" + role + '\'' +
                ", email='" + email + '\'' +
                ", profilePhoto='" + profilePhoto + '\'' +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (!(o instanceof User user))
            return false;
        return Objects.equals(id, user.id) &&
                Objects.equals(name, user.name) &&
                Objects.equals(role, user.role) &&
                Objects.equals(email, user.email);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, name, role, email);
    }
}
