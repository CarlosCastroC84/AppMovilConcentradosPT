export interface SessionModule {
    key: string;
    title: string;
    route: string;
    icon: string;
}

export interface SessionUserProfile {
    user: {
        username: string;
        email: string;
        name: string;
    };
    role: string;
    defaultRoute: string;
    permissions: string[];
    modules: SessionModule[];
}
