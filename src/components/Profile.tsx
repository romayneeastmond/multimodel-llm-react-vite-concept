import React, { useState, useEffect } from 'react';
import { useMsal } from "@azure/msal-react";
import { fetchUserGroups } from '../services/graphService';
import { ArrowLeft, Menu, User, Users, ShieldCheck, Mail, Building } from 'lucide-react';

interface ProfileProps {
	onBack: () => void;
	isSidebarOpen: boolean;
	onToggleSidebar: () => void;
}

interface Group {
	id: string;
	displayName: string;
	description?: string;
}

const Profile = ({ onBack, isSidebarOpen, onToggleSidebar }: ProfileProps) => {
	const { instance, accounts } = useMsal();
	const [groups, setGroups] = useState<Group[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const account = accounts[0];

	useEffect(() => {
		const fetchGroups = async () => {
			if (!account) return;

			setIsLoading(true);
			setError(null);

			try {
				const groupsData = await fetchUserGroups(instance, account);
				setGroups(groupsData);
			} catch (err: any) {
				console.error("Error fetching groups:", err);
				setError(err.message || "Failed to fetch groups");
			} finally {
				setIsLoading(false);
			}
		};

		fetchGroups();
	}, [account, instance]);

	return (
		<main className="flex-1 flex flex-col relative w-full h-full min-w-0 bg-app overflow-y-auto">
			<div className="sticky top-0 z-20 bg-panel/80 backdrop-blur-md border-b border-border px-4 py-4 md:px-8 flex items-center justify-between shadow-sm">
				<div className="flex items-center gap-4">
					{!isSidebarOpen && (
						<button onClick={onToggleSidebar} className="p-2 hover:bg-card-hover rounded-xl text-secondary transition-colors md:hidden">
							<Menu className="w-5 h-5" />
						</button>
					)}
					<button onClick={onBack} className="p-2 hover:bg-card-hover rounded-xl text-secondary hover:text-primary transition-all active:scale-95 group">
						<ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
					</button>
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
							<User className="w-5 h-5" />
						</div>
						<div>
							<h1 className="text-sm font-bold tracking-tight">User Profile</h1>
							<p className="text-[10px] text-secondary">Manage settings and View Profile</p>
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-4xl mx-auto w-full px-4 md:px-8 py-8 md:py-12 space-y-8">
				<div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
					<div className="flex items-start justify-between mb-6">
						<div className="flex items-center gap-4">
							<div className="w-16 h-16 bg-gradient-to-br from-accent to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
								<span className="text-2xl font-bold">{account?.name?.charAt(0) || "U"}</span>
							</div>
							<div>
								<h2 className="text-xl font-bold text-primary">{account?.name}</h2>
								<p className="text-sm text-secondary">{account?.username}</p>
							</div>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
						<div className="p-4 bg-panel rounded-2xl border border-border">
							<div className="flex items-center gap-2 block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5">
								<Mail className="w-3.5 h-3.5" /> Client ID
							</div>
							<code className="text-sm text-primary font-mono select-all bg-app px-2 py-1 rounded border border-border block overflow-hidden text-ellipsis">{account?.localAccountId}</code>
						</div>
						<div className="p-4 bg-panel rounded-2xl border border-border">
							<div className="flex items-center gap-2 block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5">
								<Building className="w-3.5 h-3.5" /> Tenant ID
							</div>
							<code className="text-sm text-primary font-mono select-all bg-app px-2 py-1 rounded border border-border block overflow-hidden text-ellipsis">{account?.tenantId}</code>
						</div>
					</div>
				</div>

				<div>
					<div className="flex items-center gap-3 text-primary mb-4">
						<ShieldCheck className="w-5 h-5 text-accent" />
						<h2 className="text-lg font-bold tracking-tight">Assigned Groups</h2>
					</div>

					{isLoading ? (
						<div className="text-center py-12 text-secondary">
							<div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
							<p>Loading group memberships...</p>
						</div>
					) : error ? (
						<div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl p-6 text-center">
							<p className="font-bold">Failed to load groups</p>
							<p className="text-sm opacity-80 mt-1">{error}</p>
						</div>
					) : groups.length === 0 ? (
						<div className="text-center py-12 text-secondary border border-dashed border-border rounded-2xl bg-panel/50">
							<Users className="w-10 h-10 opacity-20 mx-auto mb-2" />
							<p>No group assignments found.</p>
						</div>
					) : (
						<div className="grid gap-3">
							{groups.map(group => (
								<div key={group.id} className="bg-card hover:bg-card-hover border border-border p-4 rounded-xl transition-colors flex items-center justify-between group">
									<div className="flex items-center gap-3">
										<div className="p-2 bg-panel rounded-lg text-secondary group-hover:text-primary transition-colors">
											<Users className="w-4 h-4" />
										</div>
										<div>
											<h3 className="text-sm font-bold text-primary">{group.displayName}</h3>
											{group.description && <p className="text-xs text-secondary mt-0.5 line-clamp-1">{group.description}</p>}
										</div>
									</div>
									<code className="text-[10px] text-secondary font-mono bg-panel px-1.5 py-0.5 rounded border border-border opacity-60 group-hover:opacity-100 transition-opacity">
										{group.id}
									</code>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</main>
	);
};

export default Profile;
